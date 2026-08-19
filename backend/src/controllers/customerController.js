const crypto = require("crypto");

const AppContent = require("../models/AppContent");
const Category = require("../models/Category");
const Customer = require("../models/Customer");
const HomeChef = require("../models/HomeChef");
const Meal = require("../models/Meal");
const Notification = require("../models/Notification");
const Order = require("../models/Order");
const Plan = require("../models/Plan");
const Product = require("../models/Product");
const Review = require("../models/Review");
const ScheduleItem = require("../models/ScheduleItem");
const Subscription = require("../models/Subscription");
const SubscriptionRequest = require("../models/SubscriptionRequest");
const SupportTicket = require("../models/SupportTicket");
const WalletTransaction = require("../models/WalletTransaction");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const {
  syncCustomerActiveSubscription,
} = require("../utils/customerSubscription");
const { notifyVendorNewOrder } = require("../utils/partnerNotifications");
const { buildMealsFromSchedule, dayOrder } = require("../utils/tiffinSchedule");

const onlinePaymentMethods = [
  "UPI",
  "Credit Card",
  "Debit Card",
  "Net Banking",
  "Wallet",
];
const mealStatuses = [
  "Order Confirmed",
  "Preparing",
  "Ready",
  "Out For Delivery",
  "Delivered",
];
const defaultNotificationPrefs = {
  orderUpdates: true,
  promotions: true,
  mealReminders: false,
};

const contentDefaults = {
  paymentMethods: ["UPI", "Credit Card", "Debit Card", "Net Banking", "Wallet"],
  skipReasons: [],
  support: {
    channels: [],
    topics: [],
    faqs: [],
  },
  trackingStatuses: mealStatuses.map((label) => ({ label })),
};

const defaultPlans = [
  {
    name: "Trial Friendly Plan",
    meals: "7 days · 1 meal/day",
    price: "₹699",
    status: "Visible",
  },
  {
    name: "Weekly Tiffin Plan",
    meals: "7 days · Lunch + Dinner",
    price: "₹1,299",
    status: "Visible",
  },
  {
    name: "Monthly Tiffin Plan",
    meals: "30 days · Lunch + Dinner",
    price: "₹4,999",
    status: "Visible",
  },
];

const toAmountNumber = (value) => {
  const amount = Number(String(value || "").replace(/[^\d.]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
};

const formatRupees = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;

const createOrderId = () => `MID${Date.now().toString().slice(-6)}`;
const createTicketId = () => `SUP${Date.now().toString().slice(-7)}`;

const getNotificationCategory = (notification = {}) => {
  if (defaultNotificationPrefs[notification.category] !== undefined) {
    return notification.category;
  }

  const searchableText = [
    notification.type,
    notification.title,
    notification.body,
    notification.message,
    notification.tone,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/\b(promo|promotion|offer|deal|discount|coupon|menu live)\b/.test(searchableText)) {
    return "promotions";
  }
  if (/\b(reminder|remind|meal reminder|before delivery)\b/.test(searchableText)) {
    return "mealReminders";
  }
  return "orderUpdates";
};

const getContentValue = async (key) => {
  const content = await AppContent.findOne({ key, isActive: true }).lean();
  return content?.value ?? contentDefaults[key];
};

const cleanIdentity = (input = {}) => ({
  email: input.email ? String(input.email).toLowerCase().trim() : "",
  phone: input.phone ? String(input.phone).trim() : "",
  customer: input.customer ? String(input.customer).trim() : "",
});

const requestIdentity = (req, input = {}) => ({
  ...input,
  customer: input.customer || req.user?.name,
  email: input.email || input.customerEmail || req.user?.email,
  phone: input.phone || input.customerPhone || req.user?.phone,
});

const identityFilter = (input = {}) => {
  const { email, phone, customer } = cleanIdentity(input);
  const filters = [
    email ? { email } : null,
    phone ? { phone } : null,
    customer ? { name: customer } : null,
  ].filter(Boolean);

  if (!filters.length) return null;
  return filters.length === 1 ? filters[0] : { $or: filters };
};

const subscriptionIdentityFilter = (input = {}) => {
  const { email, phone, customer } = cleanIdentity(input);
  const filters = [
    email ? { customerEmail: email } : null,
    phone ? { customerPhone: phone } : null,
    customer ? { customer } : null,
  ].filter(Boolean);

  if (!filters.length) return {};
  return filters.length === 1 ? filters[0] : { $or: filters };
};

const activeSubscriptionFilter = (input = {}) => {
  const identity = subscriptionIdentityFilter(input);
  const activeWindow = {
    $or: [
      { endDate: { $exists: false } },
      { endDate: null },
      { endDate: { $gt: new Date() } },
    ],
  };
  const activeStatus = { status: "Active" };

  return Object.keys(identity).length
    ? { $and: [identity, activeStatus, activeWindow] }
    : { ...activeStatus, ...activeWindow };
};

const activeSubscriptionIdentityStatusFilter = (input = {}) => {
  const identity = subscriptionIdentityFilter(input);
  const activeStatus = { status: "Active" };

  return Object.keys(identity).length
    ? { $and: [identity, activeStatus] }
    : activeStatus;
};

const findCustomer = (input = {}) => {
  const filter = identityFilter(input);
  return filter
    ? Customer.findOne(filter).sort({ updatedAt: -1, createdAt: -1 })
    : Customer.findOne().sort({ updatedAt: -1, createdAt: -1 });
};

const getPlanDuration = (plan = {}) => {
  const text = `${plan.name || ""} ${plan.meals || ""}`;
  const match = text.match(/(\d+)\s*(day|days)/i);
  return match ? Number(match[1]) : 7;
};

const listPlans = asyncHandler(async (req, res) => {
  let plans = await Plan.find({ status: { $ne: "Hidden" } })
    .sort({ createdAt: 1 })
    .lean();

  if (!plans.length) {
    await Plan.insertMany(defaultPlans, { ordered: false }).catch(() => undefined);
    plans = await Plan.find({ status: { $ne: "Hidden" } })
      .sort({ createdAt: 1 })
      .lean();
  }

  return sendSuccess(res, 200, "Plans fetched", { plans });
});

const listMeals = asyncHandler(async (req, res) => {
  const { category, q } = req.query;
  const filter = { status: { $ne: "Inactive" } };

  if (category && category !== "All") {
    filter.category = String(category).trim();
  }
  if (q) {
    filter.name = { $regex: String(q).trim(), $options: "i" };
  }

  const [products, categories, meals] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).lean(),
    Category.find({ isActive: true }).sort({ sortOrder: 1 }).lean(),
    Meal.find().lean(),
  ]);

  return sendSuccess(res, 200, "Meals fetched", {
    meals: products,
    products,
    categories,
    featuredMeals: meals,
  });
});

const getMealById = asyncHandler(async (req, res) => {
  const meal =
    (await Product.findById(req.params.mealId).lean().catch(() => null)) ||
    (await Product.findOne({ name: req.params.mealId }).lean());

  if (!meal) {
    return res.status(404).json({ success: false, message: "Meal not found" });
  }

  return sendSuccess(res, 200, "Meal fetched", { meal });
});

const listSubscriptions = asyncHandler(async (req, res) => {
  const filter = subscriptionIdentityFilter(requestIdentity(req, req.query));
  const subscriptions = await Subscription.find(filter)
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(res, 200, "Subscriptions fetched", { subscriptions });
});

const getActiveSubscription = asyncHandler(async (req, res) => {
  const filter = activeSubscriptionFilter(requestIdentity(req, req.query));
  const subscription = await Subscription.findOne(filter)
    .sort({ updatedAt: -1 })
    .lean();

  return sendSuccess(res, 200, "Active subscription fetched", {
    subscription,
  });
});

const purchaseSubscription = asyncHandler(async (req, res) => {
  const {
    address,
    homeChefId,
    paymentId,
    paymentMethod = "UPI",
    paymentProvider = "Razorpay",
    planId,
  } = req.body;
  const identity = requestIdentity(req, req.body);
  const customer = identity.customer || "";
  const customerEmail = identity.email;
  const customerPhone = identity.phone;

  if (!planId) {
    return res.status(400).json({
      success: false,
      message: "Plan is required",
    });
  }

  if (!onlinePaymentMethods.includes(paymentMethod)) {
    return res.status(400).json({
      success: false,
      message: "Only online payments are supported for subscriptions",
    });
  }

  const plan = await Plan.findById(planId).lean().catch(() => null);

  if (!plan) {
    return res.status(404).json({ success: false, message: "Plan not found" });
  }

  const active = await Subscription.findOne(
    activeSubscriptionFilter({
      customer,
      email: customerEmail,
      phone: customerPhone,
    }),
  ).lean();

  if (active) {
    return res.status(409).json({
      success: false,
      message: "Customer already has an active subscription",
      subscription: active,
    });
  }

  const chef = homeChefId
    ? await HomeChef.findById(homeChefId).lean().catch(() => null)
    : await HomeChef.findOne({ status: { $ne: "Inactive" } })
        .sort({ isAssigned: -1, orders: -1 })
        .lean();
  const startDate = new Date();
  const durationDays = getPlanDuration(plan);
  const endDate = new Date(
    startDate.getTime() + durationDays * 24 * 60 * 60 * 1000,
  );
  const amount = plan.price || "₹0";
  const amountNumber = toAmountNumber(amount);

  if (paymentMethod === "Wallet") {
    const customerFilter = identityFilter({
      customer,
      email: customerEmail,
      phone: customerPhone,
    });

    if (!customerFilter) {
      return res.status(400).json({
        success: false,
        message: "Customer identity is required for wallet payment",
      });
    }

    const walletFilter = customerFilter.$or
      ? { $and: [customerFilter, { walletBalance: { $gte: amountNumber } }] }
      : { ...customerFilter, walletBalance: { $gte: amountNumber } };
    const walletCustomer = await Customer.findOneAndUpdate(
      walletFilter,
      { $inc: { walletBalance: -amountNumber } },
      { returnDocument: "after" },
    );

    if (!walletCustomer) {
      const existingCustomer = await Customer.findOne(customerFilter).lean();
      return res.status(400).json({
        success: false,
        message: `Insufficient wallet balance. Available ₹${existingCustomer?.walletBalance || 0}, required ₹${amountNumber}.`,
      });
    }
  }

  const order = await Order.create({
    orderId: createOrderId(),
    customer,
    customerEmail,
    customerPhone,
    meal: plan.name,
    chef: chef?.name || "",
    amount,
    orderType: "subscription",
    address,
    planType: plan.name,
    durationDays,
    totalMeals: durationDays,
    mealsPerDay: 1,
    homeChefId: chef?._id,
    homeChefName: chef?.name,
    homeChefOwner: chef?.owner,
    paymentMethod,
    paymentProvider: paymentMethod === "Wallet" ? "Wallet" : paymentProvider,
    paymentId:
      paymentMethod === "Wallet"
        ? paymentId || `wallet_${Date.now()}`
        : paymentId || `pay_${Date.now()}`,
    paymentStatus: "Paid",
  });
  notifyVendorNewOrder(order).catch((error) => {
    console.warn("[customer-order] Vendor notification failed", error.message);
  });
  const subscription = await Subscription.create({
    customer,
    customerEmail,
    customerPhone,
    plan: plan.name,
    planType: plan.name,
    durationDays,
    totalMeals: durationDays,
    mealsPerDay: 1,
    amount,
    homeChefId: chef?._id,
    homeChefName: chef?.name,
    homeChefOwner: chef?.owner,
    nextMeal: "Lunch · Tomorrow",
    skipped: "0",
    renewal: endDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    }),
    address,
    paymentMethod,
    paymentProvider: paymentMethod === "Wallet" ? "Wallet" : paymentProvider,
    paymentId: order.paymentId,
    paymentStatus: "Paid",
    orderId: order.orderId,
    startDate,
    endDate,
    status: "Active",
  });
  const updatedCustomer = await syncCustomerActiveSubscription(subscription);

  if (paymentMethod === "Wallet") {
    await WalletTransaction.create({
      customer: updatedCustomer?.name || customer,
      type: "Payment",
      amount: `-₹${amountNumber}`,
      note: `Subscription payment · ${order.orderId}`,
    });
  }

  return sendSuccess(res, 201, "Subscription activated", {
    customer: updatedCustomer,
    order,
    subscription,
  });
});

const getSubscriptionCalendar = asyncHandler(async (req, res) => {
  const identity = requestIdentity(req, req.query);
  const customer = await findCustomer(identity).lean();
  const subscription = await Subscription.findOne(
    activeSubscriptionIdentityStatusFilter({
      ...identity,
      customer: identity.customer || customer?.name,
      email: identity.email || customer?.email,
      phone: identity.phone || customer?.phone,
    }),
  )
    .sort({ updatedAt: -1 })
    .lean();
  if (!subscription) {
    return sendSuccess(res, 200, "No active subscription calendar", {
      subscription: null,
      calendar: [],
    });
  }
  const scheduleItems = await ScheduleItem.find().sort({ sortOrder: 1 }).lean();
  const dynamic = buildMealsFromSchedule(scheduleItems, {});
  const skipRequests = await SubscriptionRequest.find({
    ...(subscription ? { subscriptionId: String(subscription._id) } : {}),
    requestType: "skip_meal",
  }).lean();
  const skippedDates = new Set(
    skipRequests
      .filter((request) => request.mealDate)
      .map((request) => new Date(request.mealDate).toISOString().slice(0, 10)),
  );
  const start = subscription.startDate ? new Date(subscription.startDate) : new Date();
  const duration = Number(subscription.durationDays || 0);
  const calendar = Array.from({ length: duration }).map((_, index) => {
    const date = new Date(start.getTime() + index * 24 * 60 * 60 * 1000);
    const isoDate = date.toISOString().slice(0, 10);
    const day = dayOrder[date.getDay()];
    const schedule =
      dynamic.schedule.find((item) => item.day === day) || dynamic.schedule[0];

    return {
      date: isoDate,
      day,
      mealTitle: schedule?.title || schedule?.meal || "",
      mealType: schedule?.mealType || "",
      status: skippedDates.has(isoDate) ? "Skipped" : "Scheduled",
    };
  });

  return sendSuccess(res, 200, "Subscription calendar fetched", {
    subscription,
    calendar,
  });
});

const listCustomerOrders = asyncHandler(async (req, res) => {
  const identity = requestIdentity(req, req.query);
  const filters = [
    identity.email ? { customerEmail: String(identity.email).toLowerCase().trim() } : null,
    identity.phone ? { customerPhone: String(identity.phone).trim() } : null,
    identity.customer ? { customer: String(identity.customer).trim() } : null,
  ].filter(Boolean);

  const orders = filters.length
    ? await Order.find(filters.length === 1 ? filters[0] : { $or: filters })
        .sort({ createdAt: -1 })
        .lean()
    : [];

  return sendSuccess(res, 200, "Customer orders fetched", { orders });
});

const skipMeal = asyncHandler(async (req, res) => {
  const { mealDate, mealTitle, reason = "Customer unavailable" } = req.body;

  if (!mealDate) {
    return res.status(400).json({
      success: false,
      message: "Meal date is required",
    });
  }

  const identity = requestIdentity(req, req.body);
  const customer = await findCustomer(identity);
  const subscription = await Subscription.findOne(
    activeSubscriptionIdentityStatusFilter({
      ...identity,
      customer: identity.customer || customer?.name,
      email: identity.email || customer?.email,
      phone: identity.phone || customer?.phone,
    }),
  ).sort({ updatedAt: -1 });

  if (!subscription) {
    return res.status(404).json({
      success: false,
      message: "Active subscription not found",
    });
  }

  const request = await SubscriptionRequest.create({
    customer: customer?.name || subscription.customer,
    customerEmail: customer?.email || subscription.customerEmail,
    customerPhone: customer?.phone || subscription.customerPhone,
    subscriptionId: String(subscription._id),
    requestType: "skip_meal",
    mealDate: new Date(mealDate),
    mealTitle,
    reason,
    currentAddress: subscription.address,
    status: "Approved",
  });

  subscription.skipped = String((Number(subscription.skipped || 0) || 0) + 1);
  if (subscription.endDate) {
    const endDate = new Date(subscription.endDate);
    endDate.setDate(endDate.getDate() + 1);
    subscription.endDate = endDate;
    subscription.renewal = endDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
  }
  await subscription.save();

  return sendSuccess(res, 201, "Meal skipped", { request, subscription });
});

const listReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find().sort({ createdAt: -1 }).limit(50).lean();
  return sendSuccess(res, 200, "Reviews fetched", { reviews });
});

const createReview = asyncHandler(async (req, res) => {
  const { chef, rating, text } = req.body;
  const customer = req.body.customer || req.user?.name || "";

  if (!rating) {
    return res.status(400).json({ success: false, message: "Rating is required" });
  }

  const review = await Review.create({
    customer,
    chef,
    rating: String(rating),
    text,
  });

  return sendSuccess(res, 201, "Review submitted", { review });
});

const listNotifications = asyncHandler(async (req, res) => {
  const customerQuery = identityFilter(requestIdentity(req));
  const customer = customerQuery
    ? await Customer.findOne(customerQuery).lean()
    : null;
  const notificationPrefs = {
    ...defaultNotificationPrefs,
    ...(customer?.settings?.notifications || {}),
  };
  const notifications = await Notification.find({
    status: { $ne: "Draft" },
    $or: [{ audience: { $exists: false } }, { audience: "" }, { audience: "Customers" }],
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const visibleNotifications = notifications.filter((notification) => {
    const category = getNotificationCategory(notification);
    return notificationPrefs[category] !== false;
  });

  return sendSuccess(res, 200, "Notifications fetched", {
    notifications: visibleNotifications,
  });
});

const registerPushToken = asyncHandler(async (req, res) => {
  const { pushToken } = req.body;

  if (!pushToken) {
    return res.status(400).json({
      success: false,
      message: "Push token is required",
    });
  }

  const customer = await Customer.findOneAndUpdate(
    identityFilter(requestIdentity(req, req.body)) || {
      name: req.user?.name || req.body.customer || "",
    },
    { $set: { pushToken } },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true },
  );

  return sendSuccess(res, 200, "Push token registered", { customer });
});

const createSupportTicket = asyncHandler(async (req, res) => {
  const { channel = "App", issue, priority = "Normal" } =
    req.body;
  const customer = req.body.customer || req.user?.name || "";

  if (!issue) {
    return res.status(400).json({
      success: false,
      message: "Support issue is required",
    });
  }

  const ticket = await SupportTicket.create({
    ticketId: createTicketId(),
    customer,
    channel,
    issue,
    priority,
  });

  return sendSuccess(res, 201, "Support ticket created", { ticket });
});

const getSupportMetadata = asyncHandler(async (req, res) =>
  sendSuccess(res, 200, "Support metadata fetched", {
    support: await getContentValue("support"),
  }),
);

const getCustomerContent = asyncHandler(async (req, res) => {
  const keys = String(req.query.keys || "")
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);
  const requestedKeys = keys.length ? keys : Object.keys(contentDefaults);
  const rows = await AppContent.find({
    key: { $in: requestedKeys },
    isActive: true,
  }).lean();
  const content = requestedKeys.reduce((acc, key) => {
    const row = rows.find((item) => item.key === key);
    acc[key] = row?.value ?? contentDefaults[key];
    return acc;
  }, {});

  return sendSuccess(res, 200, "Customer app content fetched", { content });
});

const createPaymentOrder = asyncHandler(async (req, res) => {
  const amountNumber = toAmountNumber(req.body.amount);

  if (!amountNumber || amountNumber <= 0) {
    return res.status(400).json({
      success: false,
      message: "Valid payment amount is required",
    });
  }

  const paymentOrder = {
    id: `order_${crypto.randomBytes(8).toString("hex")}`,
    amount: Math.round(amountNumber * 100),
    amountDisplay: formatRupees(amountNumber),
    currency: "INR",
    provider: req.body.provider || "Razorpay",
    status: "created",
  };

  return sendSuccess(res, 201, "Payment order created", { paymentOrder });
});

const verifyPayment = asyncHandler(async (req, res) => {
  const { paymentId, provider = "Razorpay" } = req.body;

  if (!paymentId) {
    return res.status(400).json({
      success: false,
      message: "Payment id is required",
    });
  }

  return sendSuccess(res, 200, "Payment verified", {
    payment: {
      paymentId,
      provider,
      status: "Paid",
      verifiedAt: new Date(),
    },
  });
});

const getTracking = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderId: req.params.orderId }).lean();

  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  return sendSuccess(res, 200, "Tracking fetched", {
    order,
    timeline: mealStatuses.map((status) => ({
      status,
      completed: mealStatuses.indexOf(status) <= mealStatuses.indexOf(order.status),
    })),
  });
});

module.exports = {
  createPaymentOrder,
  createReview,
  createSupportTicket,
  getActiveSubscription,
  getCustomerContent,
  getMealById,
  getSubscriptionCalendar,
  getSupportMetadata,
  getTracking,
  listCustomerOrders,
  listMeals,
  listNotifications,
  listPlans,
  listReviews,
  listSubscriptions,
  purchaseSubscription,
  registerPushToken,
  skipMeal,
  verifyPayment,
};
