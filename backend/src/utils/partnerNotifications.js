const User = require("../models/User");
const Notification = require("../models/Notification");
const Order = require("../models/Order");
const { admin } = require("../config/firebaseAdmin");

const buildVendorFilters = (order = {}) => {
  const filters = [];
  const owner = String(order.homeChefOwner || "").trim();

  if (owner && /^[a-f\d]{24}$/i.test(owner)) {
    filters.push({ _id: owner });
  }

  if (owner && owner.includes("@")) {
    filters.push({ email: owner.toLowerCase() });
  }

  [order.homeChefName, order.chef].forEach((name) => {
    const cleanName = String(name || "").trim();
    if (cleanName) {
      filters.push({ name: cleanName });
      filters.push({ "partnerProfile.name": cleanName });
      filters.push({ "partnerProfile.kitchenName": cleanName });
    }
  });

  return filters;
};

const sendPush = async ({ data = {}, token, body, title }) => {
  if (!token) {
    return false;
  }

  await admin.messaging().send({
    token,
    notification: { title, body },
    android: {
      priority: 'high',
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
          badge: 1,
        },
      },
    },
    data: Object.entries(data).reduce((payload, [key, value]) => {
      payload[key] = String(value ?? "");
      return payload;
    }, {}),
  });

  return true;
};

const getVendorForOrder = async (order = {}) => {
  const filters = buildVendorFilters(order);

  if (!filters.length) {
    return null;
  }

  return User.findOne({
    role: "vendor",
    $or: filters,
  }).lean();
};

const notifyVendorNewOrder = async (order = {}) => {
  const filters = buildVendorFilters(order);
  const title = "New order assigned";
  const body = `You have a new ${order.meal || "meal"} order from ${order.customer || "a customer"}.`;
  let vendor = null;

  if (filters.length) {
    vendor = await User.findOne({
      role: "vendor",
      $or: filters,
    }).lean();
  } else {
    console.warn("[partner-notification] No vendor filters for order", order.orderId);
  }

  if (vendor?.partnerProfile?.kitchenOpen === false) {
    console.warn("[partner-notification] Vendor kitchen offline, skipping notify", {
      orderId: order.orderId,
      vendorId: vendor._id,
    });
    return { notification: null, pushed: false, skipped: true };
  }

  const notification = await Notification.create({
    title,
    body,
    audience: "Vendors",
    category: "orderUpdates",
    orderId: order.orderId,
    recipientId: vendor?._id ? String(vendor._id) : String(order.homeChefOwner || ""),
    recipientEmail: vendor?.email || (String(order.homeChefOwner || "").includes("@") ? order.homeChefOwner : ""),
    status: "Sent",
    tone: "success",
  });

  const token = vendor?.pushToken || vendor?.partnerProfile?.pushToken;

  if (!token) {
    console.warn("[partner-notification] Vendor push token missing", {
      orderId: order.orderId,
      vendorId: vendor?._id,
      vendorEmail: vendor?.email,
    });
    return { notification, pushed: false };
  }

  const pushed = await sendPush({
    token,
    title,
    body,
    data: {
      orderId: order.orderId,
      type: "vendor_order_assigned",
      screen: "orders",
    },
  }).catch((error) => {
    console.warn("[partner-notification] Push send failed", {
      code: error?.code,
      message: error?.message,
      orderId: order.orderId,
      vendorId: vendor?._id,
    });
    return false;
  });

  return { notification, pushed };
};

const notifyRiderNewAssignment = async (order = {}) => {
  const title = "New delivery assigned";
  const body = `Pickup ${order.meal || "order"} from ${order.homeChefName || order.chef || "vendor"} for ${order.customer || "customer"}.`;
  const riderFilters = [
    order.riderId ? { _id: order.riderId } : null,
    order.riderEmail ? { email: String(order.riderEmail).toLowerCase().trim() } : null,
    order.riderPhone ? { phone: String(order.riderPhone).trim() } : null,
  ].filter(Boolean);
  const rider = riderFilters.length
    ? await User.findOne({ role: "rider", $or: riderFilters }).lean()
    : null;

  if (rider?.partnerProfile?.isOnline === false) {
    console.warn("[partner-notification] Rider offline, skipping notify", {
      orderId: order.orderId,
      riderId: rider._id,
    });
    return { notification: null, pushed: false, skipped: true };
  }

  const notification = await Notification.create({
    title,
    body,
    audience: "Riders",
    category: "orderUpdates",
    orderId: order.orderId,
    recipientId: rider?._id ? String(rider._id) : String(order.riderId || ""),
    recipientEmail: rider?.email || order.riderEmail || "",
    status: "Sent",
    tone: "success",
  });

  const token = rider?.pushToken || rider?.partnerProfile?.pushToken;

  if (!token) {
    console.warn("[partner-notification] Rider push token missing", {
      orderId: order.orderId,
      riderId: rider?._id || order.riderId,
      riderEmail: rider?.email || order.riderEmail,
    });
    return { notification, pushed: false };
  }

  const pushed = await sendPush({
    token,
    title,
    body,
    data: {
      orderId: order.orderId,
      type: "rider_order_assigned",
      screen: "deliveries",
    },
  }).catch((error) => {
    console.warn("[partner-notification] Rider push send failed", {
      code: error?.code,
      message: error?.message,
      orderId: order.orderId,
      riderId: rider?._id,
    });
    return false;
  });

  return { notification, pushed };
};

const ensureVendorOrderNotifications = async (vendor = {}) => {
  if (!vendor?._id) {
    return [];
  }

  const vendorId = String(vendor._id);
  const vendorEmail = String(vendor.email || "").toLowerCase().trim();
  const kitchenName = vendor.partnerProfile?.kitchenName || vendor.name;
  const vendorNames = [vendor.name, vendor.partnerProfile?.name, kitchenName]
    .filter(Boolean)
    .map((value) => String(value).trim());

  const orderFilters = [
    { homeChefOwner: vendorId },
    vendorEmail ? { homeChefOwner: vendorEmail } : null,
    ...vendorNames.flatMap((name) => [
      { homeChefName: name },
      { chef: name },
    ]),
  ].filter(Boolean);

  if (!orderFilters.length) {
    return [];
  }

  const orders = await Order.find({
    status: { $in: ["Order Confirmed", "Accepted", "Preparing", "Ready"] },
    $or: orderFilters,
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const ensured = [];

  for (const order of orders) {
    const existing = await Notification.findOne({
      orderId: order.orderId,
      audience: "Vendors",
      $or: [
        { recipientId: vendorId },
        vendorEmail ? { recipientEmail: vendorEmail } : null,
      ].filter(Boolean),
    }).lean();

    if (existing) {
      continue;
    }

    const result = await notifyVendorNewOrder({
      ...order,
      homeChefOwner: order.homeChefOwner || vendorId,
      homeChefName: order.homeChefName || kitchenName,
      chef: order.chef || kitchenName,
    });

    if (result?.notification) {
      ensured.push(result.notification);
    }
  }

  return ensured;
};

module.exports = {
  ensureVendorOrderNotifications,
  getVendorForOrder,
  notifyRiderNewAssignment,
  notifyVendorNewOrder,
  sendPush,
};
