const User = require("../models/User");
const Customer = require("../models/Customer");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const buildCustomerQuery = (user = {}) => {
  const identities = [
    user.email ? { email: String(user.email).toLowerCase().trim() } : null,
    user.phone ? { phone: String(user.phone).trim() } : null,
  ].filter(Boolean);

  if (!identities.length) {
    return null;
  }

  return identities.length === 1 ? identities[0] : { $or: identities };
};

const syncCustomer = (user) => {
  const query = buildCustomerQuery(user);

  if (!query) {
    return null;
  }

  return Customer.findOneAndUpdate(
    query,
    {
      $set: {
        name: user.name,
        ...(user.email ? { email: user.email } : {}),
        ...(user.phone ? { phone: user.phone } : {}),
        ...(user.avatar ? { avatar: user.avatar } : {}),
        authProvider: user.authProvider || "local",
        isActive: user.isActive,
      },
      $setOnInsert: {
        walletBalance: 0,
      },
    },
    {
      returnDocument: "after",
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );
};

const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  const customer = await syncCustomer(user);

  return sendSuccess(res, 200, "Profile fetched successfully", {
    user,
    customer,
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ["name", "phone", "email", "avatar"];
  const updates = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] =
        field === "email"
          ? String(req.body[field]).toLowerCase().trim()
          : req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    returnDocument: "after",
    runValidators: true,
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  const customer = await syncCustomer(user);

  return sendSuccess(res, 200, "Profile updated successfully", {
    user,
    customer,
  });
});

module.exports = {
  getProfile,
  updateProfile,
};
