const jwt = require("jsonwebtoken");

const Category = require("../models/Category");
const HomeChef = require("../models/HomeChef");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Review = require("../models/Review");
const Subscription = require("../models/Subscription");
const SuperAdmin = require("../models/SuperAdmin");
const User = require("../models/User");
const { superAdminPermissions } = require("../models/SuperAdmin");
const { tableMap, tableNames } = require("./dataController");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const {
  syncCustomerActiveSubscription,
} = require("../utils/customerSubscription");

const protectedFields = ["_id", "__v", "createdAt", "updatedAt"];
const userRoles = ["admin", "vendor", "rider", "customer"];
const manageableAccountRoles = ["super_admin", ...userRoles];
const normalizeAccountRole = (role = "admin") => {
  const value = String(role || "").toLowerCase().trim();

  if (value === "homechef" || value === "homechefs") {
    return "vendor";
  }

  return value;
};

const cleanPayload = (payload) => {
  return Object.fromEntries(
    Object.entries(payload || {}).filter(
      ([key]) => !protectedFields.includes(key),
    ),
  );
};

const getModelForTable = (table) => tableMap[table];

const signSuperAdminToken = (admin) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing in environment variables");
  }

  return jwt.sign(
    {
      id: admin._id,
      role: admin.role,
      permissions: admin.permissions,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
  );
};

const loginSuperAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  const admin = await SuperAdmin.findOne({ email: email.toLowerCase() }).select(
    "+password",
  );

  if (!admin || !(await admin.comparePassword(password))) {
    return res.status(401).json({
      success: false,
      message: "Invalid super admin credentials",
    });
  }

  if (!admin.isActive) {
    return res.status(403).json({
      success: false,
      message: "Super admin account is inactive",
    });
  }

  admin.password = undefined;

  return sendSuccess(res, 200, "Super admin login successful", {
    token: signSuperAdminToken(admin),
    admin,
  });
});

const getSuperAdminProfile = asyncHandler(async (req, res) => {
  return sendSuccess(res, 200, "Super admin profile fetched", {
    admin: req.superAdmin,
  });
});

const updateSuperAdminPermissions = asyncHandler(async (req, res) => {
  const { permissions } = req.body;

  if (!Array.isArray(permissions)) {
    return res.status(400).json({
      success: false,
      message: "Permissions must be an array",
    });
  }

  const cleanedPermissions = [...new Set(permissions)].filter((permission) =>
    superAdminPermissions.includes(permission),
  );

  const admin = await SuperAdmin.findByIdAndUpdate(
    req.superAdmin._id,
    { permissions: cleanedPermissions },
    { returnDocument: "after", runValidators: true },
  );

  return sendSuccess(res, 200, "Super admin permissions updated", {
    admin,
    permissions: cleanedPermissions,
  });
});

const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 }).lean();
  return sendSuccess(res, 200, "Products fetched", { products });
});

const getManageableTables = asyncHandler(async (req, res) => {
  return sendSuccess(res, 200, "Manageable tables fetched", {
    tables: tableNames,
  });
});

const getManagedTableData = asyncHandler(async (req, res) => {
  const { table } = req.params;
  const Model = getModelForTable(table);

  if (!Model) {
    return res.status(404).json({
      success: false,
      message: `Unknown table: ${table}`,
      tables: tableNames,
    });
  }

  let rows = await Model.find().sort({ createdAt: -1 }).lean();

  if (table === "homeChefs") {
    const [vendors, allOrders, allReviews] = await Promise.all([
      User.find({ role: "vendor" }).select("-password").lean(),
      Order.find({}).lean(),
      Review.find({}).lean(),
    ]);
    const chefNames = new Set(rows.map(c => String(c.name || '').toLowerCase().trim()).filter(Boolean));
    const chefEmails = new Set(rows.map(c => String(c.email || '').toLowerCase().trim()).filter(Boolean));
    const chefIds = new Set(rows.map(c => String(c._id || '')).filter(Boolean));

    vendors.forEach(u => {
      const profile = u.partnerProfile || {};
      const kitchenName = profile.kitchenName || profile.name || u.name;
      const email = String(u.email || profile.email || '').toLowerCase().trim();
      const cleanKitchen = String(kitchenName || '').toLowerCase().trim();
      const userId = String(u._id || '');

      if (!chefIds.has(userId) && (!cleanKitchen || !chefNames.has(cleanKitchen)) && (!email || !chefEmails.has(email))) {
        rows.push({
          _id: u._id,
          name: kitchenName,
          owner: profile.owner || profile.name || u.name,
          email: u.email || profile.email || "",
          phone: u.phone || profile.phone || "",
          cuisine: profile.cuisine || profile.category || "North Indian",
          tags: profile.tags || ["Veg", "Home Style"],
          address: profile.address || profile.location || profile.city || "",
          liveAddress: profile.liveAddress || profile.address || profile.location || "",
          location: profile.city || profile.location || "",
          latitude: profile.latitude,
          longitude: profile.longitude,
          weeklyMenu: profile.weeklyMenu || [],
          sampleMenu: profile.sampleMenu || [],
          rating: profile.rating || "",
          orders: 0,
          status: u.isActive ? (profile.kycStatus === "Approved" ? "Active" : "Review") : "Inactive",
        });
        if (cleanKitchen) chefNames.add(cleanKitchen);
        if (email) chefEmails.add(email);
        if (userId) chefIds.add(userId);
      }
    });

    rows = rows.map(chef => {
      const chefIdentifiers = [
        String(chef._id || "").toLowerCase(),
        String(chef.name || "").toLowerCase(),
        String(chef.owner || "").toLowerCase(),
        String(chef.email || "").toLowerCase(),
      ].filter(Boolean);

      const matchingOrders = (allOrders || []).filter(order => {
        const orderChefIds = [
          order.homeChefId,
          order.homeChefName,
          order.homeChefOwner,
          order.chef,
        ].map(v => String(v || "").toLowerCase().trim()).filter(Boolean);
        return orderChefIds.some(id => chefIdentifiers.includes(id));
      });

      const realOrdersCount = Math.max(Number(chef.orders || 0), matchingOrders.length);

      const chefReviews = (allReviews || []).filter(r => {
        const reviewChef = String(r.chef || "").toLowerCase().trim();
        return reviewChef && chefIdentifiers.some(id => id.includes(reviewChef) || reviewChef.includes(id));
      });

      let realRating = chef.rating;
      if (chefReviews.length > 0) {
        const sum = chefReviews.reduce((acc, r) => acc + (parseFloat(r.rating) || 0), 0);
        realRating = (sum / chefReviews.length).toFixed(1);
      } else if (!realRating || realRating === "4.8") {
        realRating = (chef.reviewCount && Number(chef.reviewCount) > 0) ? String(chef.rating || "4.5") : "New";
      }

      return {
        ...chef,
        orders: realOrdersCount,
        rating: realRating,
      };
    });
  }

  if (table === "customers") {
    const customerUsers = await User.find({ role: "customer" }).select("-password").lean();
    const customerPhones = new Set(rows.map(c => String(c.phone || "").trim()).filter(Boolean));
    const customerEmails = new Set(rows.map(c => String(c.email || "").toLowerCase().trim()).filter(Boolean));

    customerUsers.forEach(u => {
      const phone = String(u.phone || "").trim();
      const email = String(u.email || "").toLowerCase().trim();
      const hasMatch = (phone && customerPhones.has(phone)) || (email && customerEmails.has(email));
      if (!hasMatch) {
        rows.push({
          _id: u._id,
          name: u.name || "MIDDO Customer",
          phone: u.phone,
          email: u.email,
          authProvider: u.authProvider || "local",
          location: u.city || "",
          address: u.address || "",
          liveAddress: u.address || "",
          walletBalance: 0,
          orders: 0,
        });
        if (phone) customerPhones.add(phone);
        if (email) customerEmails.add(email);
      }
    });
  }

  return sendSuccess(res, 200, `${table} data fetched`, { table, rows });
});

const createManagedTableRow = asyncHandler(async (req, res) => {
  const { table } = req.params;
  const Model = getModelForTable(table);

  if (!Model) {
    return res.status(404).json({
      success: false,
      message: `Unknown table: ${table}`,
      tables: tableNames,
    });
  }

  const row = await Model.create(cleanPayload(req.body));
  return sendSuccess(res, 201, `${table} row created successfully`, {
    table,
    row,
  });
});

const updateManagedTableRow = asyncHandler(async (req, res) => {
  const { id, table } = req.params;
  const Model = getModelForTable(table);

  if (!Model) {
    return res.status(404).json({
      success: false,
      message: `Unknown table: ${table}`,
      tables: tableNames,
    });
  }

  const row = await Model.findByIdAndUpdate(id, cleanPayload(req.body), {
    returnDocument: "after",
    runValidators: true,
  });

  if (!row) {
    const userRole = table === "homeChefs" ? "vendor" : table === "customers" ? "customer" : null;

    if (userRole) {
      const payload = cleanPayload(req.body);
      const userUpdate = table === "customers"
        ? {
            ...(payload.name !== undefined ? { name: payload.name } : {}),
            ...(payload.email !== undefined ? { email: payload.email } : {}),
            ...(payload.phone !== undefined ? { phone: payload.phone } : {}),
            ...(Object.keys(payload).some((key) => ["address", "liveAddress", "location", "latitude", "longitude"].includes(key))
              ? {
                  partnerProfile: {
                    ...(await User.findOne({ _id: id, role: userRole }).select("partnerProfile").lean())?.partnerProfile,
                    ...Object.fromEntries(
                      Object.entries(payload).filter(([key]) => ["address", "liveAddress", "location", "latitude", "longitude"].includes(key)),
                    ),
                  },
                }
              : {}),
          }
        : {
            ...(payload.name !== undefined ? { name: payload.name } : {}),
            ...(payload.email !== undefined ? { email: payload.email } : {}),
            ...(payload.phone !== undefined ? { phone: payload.phone } : {}),
            partnerProfile: {
              ...(await User.findOne({ _id: id, role: userRole }).select("partnerProfile").lean())?.partnerProfile,
              ...payload,
            },
          };
      const user = await User.findOneAndUpdate(
        { _id: id, role: userRole },
        userUpdate,
        { returnDocument: "after", runValidators: true },
      ).select("-password").lean();

      if (user) {
        return sendSuccess(res, 200, `${table} row updated successfully`, {
          table,
          row: { ...user, ...(user.partnerProfile || {}) },
        });
      }
    }

    return res.status(404).json({
      success: false,
      message: `${table} row not found`,
    });
  }

  if (
    table === "homeChefChangeRequests" &&
    ["Approved", "Assigned"].includes(row.status) &&
    row.assignedChefId
  ) {
    await HomeChef.updateMany({}, { $set: { isAssigned: false } });
    await HomeChef.findByIdAndUpdate(row.assignedChefId, {
      $set: { isAssigned: true },
    });
  }

  return sendSuccess(res, 200, `${table} row updated successfully`, {
    table,
    row,
  });
});

const expireSubscription = asyncHandler(async (req, res) => {
  const row = await Subscription.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        status: "Expired",
        endDate: new Date(),
        renewal: "Expired",
      },
    },
    { returnDocument: "after", runValidators: true },
  );

  if (!row) {
    return res.status(404).json({
      success: false,
      message: "Subscription not found",
    });
  }

  await syncCustomerActiveSubscription(row);

  return sendSuccess(res, 200, "Subscription expired successfully", {
    row,
    subscription: row,
  });
});

const deleteManagedTableRow = asyncHandler(async (req, res) => {
  const { id, table } = req.params;
  const Model = getModelForTable(table);

  if (!Model) {
    return res.status(404).json({
      success: false,
      message: `Unknown table: ${table}`,
      tables: tableNames,
    });
  }

  const row = await Model.findByIdAndDelete(id);

  if (!row) {
    const userRole = table === "homeChefs" ? "vendor" : table === "customers" ? "customer" : null;
    if (userRole) {
      const user = await User.findOneAndDelete({ _id: id, role: userRole });
      if (user) {
        return sendSuccess(res, 200, `${table} row deleted successfully`, {
          table,
          row: user,
        });
      }
    }

    return res.status(404).json({
      success: false,
      message: `${table} row not found`,
    });
  }

  return sendSuccess(res, 200, `${table} row deleted successfully`, {
    table,
    row,
  });
});

const createProduct = asyncHandler(async (req, res) => {
  const { image, name, category, description, mealType, tags, price, status } =
    req.body;

  if (!name || !category || !price) {
    return res.status(400).json({
      success: false,
      message: "Product name, category and price are required",
    });
  }

  const product = await Product.create({
    image,
    name,
    category,
    description,
    mealType,
    tags: Array.isArray(tags)
      ? tags
      : String(tags || "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
    price,
    status,
    createdBy: req.superAdmin.email,
  });

  return sendSuccess(res, 201, "Product created successfully", { product });
});

const updateProduct = asyncHandler(async (req, res) => {
  const { image, name, category, description, mealType, tags, price, status } =
    req.body;
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    {
      image,
      name,
      category,
      description,
      mealType,
      tags: Array.isArray(tags)
        ? tags
        : String(tags || "")
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
      price,
      status,
      createdBy: req.superAdmin.email,
    },
    { returnDocument: "after", runValidators: true },
  );

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  return sendSuccess(res, 200, "Product updated successfully", { product });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  return sendSuccess(res, 200, "Product deleted successfully", { product });
});

const createCategory = asyncHandler(async (req, res) => {
  const { icon, label, sortOrder } = req.body;

  if (!label) {
    return res.status(400).json({
      success: false,
      message: "Category label is required",
    });
  }

  const category = await Category.create({
    icon,
    label,
    sortOrder,
  });

  return sendSuccess(res, 201, "Category created successfully", { category });
});

const getAdmins = asyncHandler(async (req, res) => {
  const [superAdmins, users] = await Promise.all([
    SuperAdmin.find({}).sort({ createdAt: -1 }).select("-password").lean(),
    User.find({}).sort({ createdAt: -1 }).select("-password").lean(),
  ]);
  const admins = [
    ...superAdmins.map((admin) => ({
      ...admin,
      role: "super_admin",
      accountType: "super_admin",
    })),
    ...users.map((user) => ({
      ...user,
      accountType: "user",
    })),
  ].sort(
    (left, right) =>
      new Date(right.createdAt || 0) - new Date(left.createdAt || 0),
  );

  return sendSuccess(res, 200, "Users fetched", { admins });
});

const createAdmin = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    phone,
    password,
    role = "admin",
    isActive = true,
  } = req.body;
  const normalizedRole = normalizeAccountRole(role);

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Name, email and password are required",
    });
  }

  if (!manageableAccountRoles.includes(normalizedRole)) {
    return res.status(400).json({
      success: false,
      message: "Invalid role selected",
      roles: manageableAccountRoles,
    });
  }

  const normalizedEmail = email.toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });
  const existingSuperAdmin = await SuperAdmin.findOne({
    email: normalizedEmail,
  });

  if (existingUser || existingSuperAdmin) {
    return res.status(409).json({
      success: false,
      message: "Email already exists",
    });
  }

  const admin =
    normalizedRole === "super_admin"
      ? await SuperAdmin.create({
          name,
          email: normalizedEmail,
          password,
          permissions: superAdminPermissions,
          isActive,
        })
      : await User.create({
          name,
          email: normalizedEmail,
          phone,
          password,
          role: normalizedRole,
          isActive,
        });

  admin.password = undefined;

  return sendSuccess(res, 201, "User created successfully", {
    admin: {
      ...admin.toObject(),
      role: normalizedRole,
      accountType: normalizedRole === "super_admin" ? "super_admin" : "user",
    },
  });
});

const updateAdmin = asyncHandler(async (req, res) => {
  const allowedFields = [
    "name",
    "email",
    "phone",
    "role",
    "isActive",
    "password",
  ];
  const updates = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined && req.body[field] !== "") {
      updates[field] =
        field === "email"
          ? req.body[field].toLowerCase()
          : field === "role"
            ? normalizeAccountRole(req.body[field])
            : req.body[field];
    }
  });

  const admin = await User.findById(req.params.id).select("+password");

  if (admin) {
    if (updates.role && !userRoles.includes(updates.role)) {
      return res.status(400).json({
        success: false,
        message:
          "Normal users can only use admin, vendor, rider or customer roles",
        roles: userRoles,
      });
    }

    Object.assign(admin, updates);
    await admin.save();
    admin.password = undefined;

    return sendSuccess(res, 200, "User updated successfully", {
      admin: {
        ...admin.toObject(),
        accountType: "user",
      },
    });
  }

  const superAdmin = await SuperAdmin.findById(req.params.id).select(
    "+password",
  );

  if (!superAdmin) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  const { role, phone, ...superAdminUpdates } = updates;
  Object.assign(superAdmin, superAdminUpdates);
  await superAdmin.save();
  superAdmin.password = undefined;

  return sendSuccess(res, 200, "Super admin updated successfully", {
    admin: {
      ...superAdmin.toObject(),
      role: "super_admin",
      phone,
      accountType: "super_admin",
    },
  });
});

const deleteAdmin = asyncHandler(async (req, res) => {
  if (String(req.superAdmin?._id) === String(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "You cannot delete the active super admin account",
    });
  }

  const superAdmin = await SuperAdmin.findByIdAndDelete(req.params.id);

  if (superAdmin) {
    return sendSuccess(res, 200, "Super admin deleted successfully", {
      admin: {
        ...superAdmin.toObject(),
        role: "super_admin",
        accountType: "super_admin",
      },
    });
  }

  const admin = await User.findByIdAndDelete(req.params.id);

  if (!admin) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  return sendSuccess(res, 200, "User deleted successfully", { admin });
});

module.exports = {
  createAdmin,
  createCategory,
  createManagedTableRow,
  createProduct,
  deleteAdmin,
  deleteProduct,
  deleteManagedTableRow,
  expireSubscription,
  getAdmins,
  getManageableTables,
  getManagedTableData,
  getProducts,
  getSuperAdminProfile,
  loginSuperAdmin,
  updateSuperAdminPermissions,
  updateAdmin,
  updateManagedTableRow,
  updateProduct,
};
