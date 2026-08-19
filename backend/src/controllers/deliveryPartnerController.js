const Order = require("../models/Order");
const Notification = require("../models/Notification");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const {
  ensureVendorOrderNotifications,
  sendPush,
} = require("../utils/partnerNotifications");

const deliveryStatuses = ["Ready", "Out For Delivery"];
const vendorStatuses = [
  "Order Confirmed",
  "Accepted",
  "Preparing",
  "Ready",
  "Out For Delivery",
  "Delivered",
];
const fallbackPartnerEmail = "test@example.com";

const normalizePartnerRole = (role = "") => {
  const value = String(role || "").toLowerCase().trim();

  if (value === "rider" || value === "delivery" || value === "partner") {
    return "rider";
  }

  return "homechef";
};

const toUserRole = (partnerRole) =>
  normalizePartnerRole(partnerRole) === "rider" ? "rider" : "vendor";

const getPartnerIdentity = (req) => {
  const body = req.body || {};
  const email = String(
    req.user?.email || body.email || fallbackPartnerEmail,
  )
    .toLowerCase()
    .trim();
  const phone = String(req.user?.phone || body.phone || "").trim();

  return {
    email,
    phone,
    query: req.user?.id ? { _id: req.user.id } : { email },
  };
};

const buildDefaultProfile = (user = {}, overrides = {}) => {
  const partnerProfile = user.partnerProfile || {};
  const role = normalizePartnerRole(
    overrides.role || partnerProfile.role || user.role,
  );

  return {
    name: user.name || overrides.name || "Test partner",
    email: user.email || overrides.email || fallbackPartnerEmail,
    phone: user.phone || overrides.phone || "",
    avatar: user.avatar || "",
    role,
    isOnline: partnerProfile.isOnline !== false,
    kitchenOpen: partnerProfile.kitchenOpen !== false,
    ...partnerProfile,
    ...overrides,
    role,
    isOnline:
      overrides.isOnline !== undefined
        ? Boolean(overrides.isOnline)
        : partnerProfile.isOnline !== false,
    kitchenOpen:
      overrides.kitchenOpen !== undefined
        ? Boolean(overrides.kitchenOpen)
        : partnerProfile.kitchenOpen !== false,
  };
};

const isRiderOnline = (user = {}) => user?.partnerProfile?.isOnline !== false;

const isVendorKitchenOpen = (user = {}) =>
  user?.partnerProfile?.kitchenOpen !== false;

const getOrCreatePartnerUser = async (req, profilePatch = {}) => {
  const identity = getPartnerIdentity(req);
  const partnerRole = normalizePartnerRole(
    profilePatch.role || req.user?.role || profilePatch.partnerRole,
  );
  const existingUser = await User.findOne(identity.query).lean();
  const existingProfile = buildDefaultProfile(existingUser || {}, {
    email: identity.email,
    phone: identity.phone,
  });
  const nextProfile = {
    ...existingProfile,
    ...profilePatch,
    email: String(profilePatch.email || existingProfile.email || identity.email)
      .toLowerCase()
      .trim(),
    phone: String(profilePatch.phone || existingProfile.phone || identity.phone || "").trim(),
    role: partnerRole,
  };
  if (nextProfile.dailyCapacity !== undefined && nextProfile.dailyCapacity !== "") {
    nextProfile.dailyCapacity = Math.max(1, Number(nextProfile.dailyCapacity) || 150);
  }
  const update = {
    name: nextProfile.name || existingProfile.name || "Test partner",
    email: nextProfile.email,
    phone: nextProfile.phone,
    authProvider: req.user?.authProvider || "phone",
    role: toUserRole(partnerRole),
    isActive: true,
    partnerProfile: nextProfile,
  };

  if (nextProfile.pushToken !== undefined) {
    update.pushToken = nextProfile.pushToken;
  }

  if (nextProfile.avatar !== undefined) {
    update.avatar = nextProfile.avatar;
  }

  const user = await User.findOneAndUpdate(identity.query, update, {
    returnDocument: "after",
    upsert: true,
    runValidators: true,
    setDefaultsOnInsert: true,
  }).lean();

  return {
    profile: buildDefaultProfile(user),
    user,
  };
};

const toAmountNumber = (value) =>
  Number(String(value || "").replace(/[^\d.]/g, "")) || 0;

const listDeliveryOrders = asyncHandler(async (req, res) => {
  const statuses = req.user?.role === "rider" ? deliveryStatuses : vendorStatuses;

  if (req.user?.role === "vendor") {
    const vendor = await User.findById(req.user.id).lean();
    await ensureVendorOrderNotifications(vendor).catch((error) => {
      console.warn("[partner-orders] Unable to ensure vendor notifications", error.message);
    });
  }

  const riderFilters = req.user?.role === "rider"
    ? [
        req.user.id ? { riderId: String(req.user.id) } : null,
        req.user.email ? { riderEmail: String(req.user.email).toLowerCase().trim() } : null,
        req.user.phone ? { riderPhone: String(req.user.phone).trim() } : null,
      ].filter(Boolean)
    : [];
  const orders = await Order.find({
    status: { $in: statuses },
    ...(riderFilters.length ? { $or: riderFilters } : {}),
  })
    .sort(
      req.user?.role === "rider"
        ? { deliveryBatchId: 1, deliverySequence: 1, updatedAt: -1, createdAt: -1 }
        : { updatedAt: -1, createdAt: -1 },
    )
    .lean();

  return sendSuccess(res, 200, "Delivery orders fetched", { orders });
});

const getDeliveryOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderId: req.params.orderId }).lean();

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }

  return sendSuccess(res, 200, "Delivery order fetched", { order });
});

const getPartnerProfile = asyncHandler(async (req, res) => {
  const { profile, user } = await getOrCreatePartnerUser(req);

  return sendSuccess(res, 200, "Partner profile fetched", { profile, user });
});

const updatePartnerProfile = asyncHandler(async (req, res) => {
  const { profile, user } = await getOrCreatePartnerUser(req, req.body || {});

  return sendSuccess(res, 200, "Partner profile updated", { profile, user });
});

const updatePartnerRole = asyncHandler(async (req, res) => {
  const role = normalizePartnerRole(req.body?.role);
  const { profile, user } = await getOrCreatePartnerUser(req, { role });

  return sendSuccess(res, 200, "Partner role updated", { profile, user });
});

const updatePartnerAvailability = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const partnerRole = normalizePartnerRole(
    body.role || req.user?.role || req.user?.partnerProfile?.role,
  );
  const patch = {};

  if (partnerRole === "rider" && typeof body.isOnline === "boolean") {
    patch.isOnline = body.isOnline;
  }

  if (partnerRole !== "rider") {
    if (typeof body.kitchenOpen === "boolean") {
      patch.kitchenOpen = body.kitchenOpen;
    } else if (typeof body.isOnline === "boolean") {
      patch.kitchenOpen = body.isOnline;
    }
  }

  if (!Object.keys(patch).length) {
    return res.status(400).json({
      success: false,
      message:
        partnerRole === "rider"
          ? "isOnline boolean is required"
          : "kitchenOpen boolean is required",
    });
  }

  const { profile, user } = await getOrCreatePartnerUser(req, patch);

  return sendSuccess(res, 200, "Partner availability updated", { profile, user });
});

const getHomeChefMenu = asyncHandler(async (req, res) => {
  const { profile } = await getOrCreatePartnerUser(req);

  return sendSuccess(res, 200, "Partner menu fetched", {
    photos: profile.photos || [],
    sampleMenu: profile.sampleMenu || [],
    weeklyMenu: profile.weeklyMenu || [],
  });
});

const updateHomeChefMenu = asyncHandler(async (req, res) => {
  const { profile } = await getOrCreatePartnerUser(req, {
    sampleMenu: Array.isArray(req.body?.sampleMenu) ? req.body.sampleMenu : [],
    weeklyMenu: Array.isArray(req.body?.weeklyMenu) ? req.body.weeklyMenu : [],
  });

  return sendSuccess(res, 200, "Partner menu updated", {
    photos: profile.photos || [],
    sampleMenu: profile.sampleMenu || [],
    weeklyMenu: profile.weeklyMenu || [],
  });
});

const getHomeChefPhotos = asyncHandler(async (req, res) => {
  const { profile } = await getOrCreatePartnerUser(req);

  return sendSuccess(res, 200, "Partner photos fetched", {
    photos: profile.photos || [],
  });
});

const registerPartnerPushToken = asyncHandler(async (req, res) => {
  const { pushToken } = req.body || {};

  if (!pushToken) {
    return res.status(400).json({
      success: false,
      message: "Push token is required",
    });
  }

  const { profile, user } = await getOrCreatePartnerUser(req, {
    pushToken,
  });

  return sendSuccess(res, 200, "Partner push token registered", {
    profile,
    user,
  });
});

const listPartnerNotifications = asyncHandler(async (req, res) => {
  const identity = getPartnerIdentity(req);
  if (req.user?.role === "vendor") {
    const vendor = await User.findById(req.user.id).lean();
    await ensureVendorOrderNotifications(vendor).catch((error) => {
      console.warn("[partner-notifications] Unable to ensure vendor notifications", error.message);
    });
  }

  const filters = [
    req.user?.id ? { recipientId: String(req.user.id) } : null,
    identity.email ? { recipientEmail: identity.email } : null,
  ].filter(Boolean);

  if (!filters.length) {
    return sendSuccess(res, 200, "Partner notifications fetched", {
      notifications: [],
    });
  }

  const notifications = await Notification.find({
    status: { $ne: "Draft" },
    $or: filters,
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return sendSuccess(res, 200, "Partner notifications fetched", {
    notifications,
  });
});

const sendPartnerTestPush = asyncHandler(async (req, res) => {
  const identity = getPartnerIdentity(req);
  const user = await User.findOne(identity.query).lean();
  const token = user?.pushToken || user?.partnerProfile?.pushToken;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: "Partner push token is not registered on this account",
    });
  }

  const pushed = await sendPush({
    token,
    title: "MIDDO test notification",
    body: "Push notification setup working hai",
    data: {
      type: "partner_test_push",
      screen: "alerts",
    },
  }).catch((error) => {
    return {
      code: error?.code,
      message: error?.message,
    };
  });

  if (pushed !== true) {
    return res.status(500).json({
      success: false,
      message: "Push send failed",
      error: pushed,
    });
  }

  return sendSuccess(res, 200, "Test push sent", { pushed: true });
});

const updateHomeChefPhotos = asyncHandler(async (req, res) => {
  const { profile } = await getOrCreatePartnerUser(req, {
    photos: Array.isArray(req.body?.photos) ? req.body.photos : [],
  });

  return sendSuccess(res, 200, "Partner photos updated", {
    photos: profile.photos || [],
  });
});

const getDeliveryOrderDashboard = asyncHandler(async (req, res) => {
  const { profile } = await getOrCreatePartnerUser(req);
  const dailyCapacity = Number(profile.dailyCapacity || 150);
  const orders = await Order.find({}).lean();
  const dashboard = orders.reduce(
    (totals, order) => {
      const amount = toAmountNumber(order.amount);

      totals.todayOrders += 1;

      if (order.status === "Delivered") {
        totals.completedOrders += 1;
        totals.earnings += amount;
      } else {
        totals.pendingOrders += 1;
      }

      if (order.orderType === "subscription") {
        totals.subscriptionOrders += 1;
      }

      if (order.orderType === "single") {
        totals.trialOrders += 1;
      }

      return totals;
    },
    {
      completedOrders: 0,
      earnings: 0,
      mealSlots: [],
      pendingOrders: 0,
      subscriptionOrders: 0,
      todayOrders: 0,
      trialOrders: 0,
      dailyCapacity,
    },
  );
  dashboard.capacityReached = dashboard.todayOrders >= dailyCapacity;
  dashboard.remainingCapacity = Math.max(0, dailyCapacity - dashboard.todayOrders);

  return sendSuccess(res, 200, "Partner dashboard fetched", { dashboard });
});

module.exports = {
  getDeliveryOrderDashboard,
  getDeliveryOrderById,
  getHomeChefMenu,
  getHomeChefPhotos,
  getPartnerProfile,
  isRiderOnline,
  isVendorKitchenOpen,
  listPartnerNotifications,
  registerPartnerPushToken,
  sendPartnerTestPush,
  listDeliveryOrders,
  updateHomeChefMenu,
  updateHomeChefPhotos,
  updatePartnerAvailability,
  updatePartnerProfile,
  updatePartnerRole,
};
