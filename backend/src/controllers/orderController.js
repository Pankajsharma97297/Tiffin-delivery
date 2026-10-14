const Order = require("../models/Order");
const Customer = require("../models/Customer");
const HomeChef = require("../models/HomeChef");
const Subscription = require("../models/Subscription");
const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const {
  syncCustomerActiveSubscription,
} = require("../utils/customerSubscription");
const {
  notifyOrderStatusChange,
  notifyRiderNewAssignment,
  notifyVendorNewOrder,
} = require("../utils/partnerNotifications");

const createOrderId = () => `MID${Date.now().toString().slice(-6)}`;
const trackingStatuses = [
  "Order Confirmed",
  "Accepted",
  "Preparing",
  "Ready",
  "Out For Delivery",
  "Delivered",
];
const paymentMethods = [
  "UPI",
  "Credit Card",
  "Debit Card",
  "Net Banking",
  "Wallet",
];

const buildOrderLookupFromUser = (user = {}) => {
  const identities = [
    user.email ? { customerEmail: String(user.email).toLowerCase().trim() } : null,
    user.phone ? { customerPhone: String(user.phone).trim() } : null,
    user.name ? { customer: String(user.name).trim() } : null,
  ].filter(Boolean);

  if (!identities.length) {
    return {};
  }

  return identities.length === 1 ? identities[0] : { $or: identities };
};

const toAmountNumber = (value) => {
  const amount = Number(String(value || "").replace(/[^\d.]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
};

const getDayBounds = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { end, start };
};

const buildVendorIdentityFilter = ({ chef, homeChefName, homeChefOwner }) => {
  const filters = [];
  const owner = String(homeChefOwner || "").trim();

  if (owner && /^[a-f\d]{24}$/i.test(owner)) {
    filters.push({ _id: owner });
  }

  if (owner && owner.includes("@")) {
    filters.push({ email: owner.toLowerCase() });
  }

  [homeChefName, chef].forEach(name => {
    const cleanName = String(name || "").trim();
    if (cleanName) {
      filters.push({ name: cleanName });
      filters.push({ "partnerProfile.name": cleanName });
      filters.push({ "partnerProfile.kitchenName": cleanName });
    }
  });

  if (!filters.length) {
    return null;
  }

  return { role: "vendor", $or: filters };
};

const enforceVendorDailyCapacity = async ({
  chef,
  homeChefName,
  homeChefOwner,
  statuses,
}) => {
  const vendorFilter = buildVendorIdentityFilter({
    chef,
    homeChefName,
    homeChefOwner,
  });

  if (!vendorFilter) {
    return;
  }

  const vendor = await User.findOne(vendorFilter).lean();
  const capacity = Number(vendor?.partnerProfile?.dailyCapacity || 0);

  if (!vendor || !capacity) {
    return;
  }

  const { end, start } = getDayBounds();
  const orderFilters = [
    vendor._id ? { homeChefOwner: String(vendor._id) } : null,
    vendor.email ? { homeChefOwner: vendor.email } : null,
    vendor.name ? { homeChefName: vendor.name } : null,
    vendor.name ? { chef: vendor.name } : null,
    vendor.partnerProfile?.kitchenName ? { homeChefName: vendor.partnerProfile.kitchenName } : null,
    vendor.partnerProfile?.kitchenName ? { chef: vendor.partnerProfile.kitchenName } : null,
  ].filter(Boolean);

  const todayOrders = await Order.countDocuments({
    createdAt: { $gte: start, $lt: end },
    ...(statuses?.length ? { status: { $in: statuses } } : {}),
    ...(orderFilters.length ? { $or: orderFilters } : {}),
  });

  if (todayOrders >= capacity) {
    const error = new Error(
      `Vendor daily capacity reached. Maximum ${capacity} tiffins/day are available.`,
    );
    error.statusCode = 409;
    throw error;
  }
};

const getActiveSubscriptionFilter = ({ customer, customerPhone }) => {
  const customerMatches = [
    customerPhone ? { customerPhone } : null,
    customer ? { customer } : null,
  ].filter(Boolean);

  if (!customerMatches.length) {
    return null;
  }

  return {
    status: "Active",
    $and: [
      { $or: customerMatches },
      {
        $or: [
          { endDate: { $exists: false } },
          { endDate: null },
          { endDate: { $gt: new Date() } },
        ],
      },
    ],
  };
};

const expireElapsedSubscriptions = () =>
  Subscription.updateMany(
    { status: "Active", endDate: { $lte: new Date() } },
    { $set: { status: "Expired" } },
  );

const sendAssignmentError = (res, error, label) => {
  const statusCode =
    error.statusCode ||
    (error.name === "ValidationError" || error.name === "CastError" ? 400 : 409);
  const message =
    error.name === "ValidationError"
      ? Object.values(error.errors || {})
          .map((item) => item.message)
          .filter(Boolean)
          .join(", ") || error.message
      : error.name === "CastError"
        ? `Invalid ${error.path || "id"} value`
        : error.message || `${label} failed`;

  console.error("[order-assignment]", {
    label,
    message,
    stack: error.stack,
    statusCode,
  });

  return res.status(statusCode).json({
    success: false,
    message,
  });
};

const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find(buildOrderLookupFromUser(req.user))
    .sort({ createdAt: -1 })
    .lean();
  return sendSuccess(res, 200, "Orders fetched", { orders });
});

const createOrder = asyncHandler(async (req, res) => {
  const {
    address,
    amount,
    chef,
    customer,
    customerEmail,
    customerPhone,
    durationDays,
    eta,
    homeChefId,
    homeChefName,
    homeChefOwner,
    items,
    latitude,
    longitude,
    meal,
    mealsPerDay,
    notes,
    orderType,
    paymentMethod,
    paymentProvider,
    paymentId,
    paymentStatus,
    perMealPrice,
    planType,
    source,
    status,
    totalMeals,
  } = req.body;

  const authenticatedCustomer = req.user?.name || customer;
  const authenticatedEmail = req.user?.email || customerEmail;
  const authenticatedPhone = req.user?.phone || customerPhone;

  if (!authenticatedCustomer || !meal || !amount || !paymentMethod) {
    return res.status(400).json({
      success: false,
      message: "Customer, meal, amount and online payment method are required",
    });
  }

  if (!paymentMethods.includes(paymentMethod)) {
    return res.status(400).json({
      success: false,
      message:
        "Only online and wallet payments are supported. COD is not available",
    });
  }

  if (orderType === "subscription") {
    await expireElapsedSubscriptions();
    const activeFilter = getActiveSubscriptionFilter({
      customer: authenticatedCustomer,
      customerPhone: authenticatedPhone,
    });
    const activeSubscription = activeFilter
      ? await Subscription.findOne(activeFilter).lean()
      : null;

    if (activeSubscription) {
      return res.status(409).json({
        success: false,
        message: `You already have an active subscription until ${activeSubscription.renewal || "expiry"}. You can subscribe again after it expires.`,
        subscription: activeSubscription,
      });
    }
  }

  await enforceVendorDailyCapacity({
    chef,
    homeChefName,
    homeChefOwner,
  });

  let debitedWalletCustomer = null;
  const amountNumber = toAmountNumber(amount);

  if (paymentMethod === "Wallet") {
    const walletFilter = authenticatedEmail
      ? { email: String(authenticatedEmail).toLowerCase().trim() }
      : authenticatedPhone
        ? { phone: String(authenticatedPhone).trim() }
        : { name: authenticatedCustomer };

    debitedWalletCustomer = await Customer.findOneAndUpdate(
      { ...walletFilter, walletBalance: { $gte: amountNumber } },
      { $inc: { walletBalance: -amountNumber } },
      { returnDocument: "after" },
    );

    if (!debitedWalletCustomer) {
      const existingCustomer = await Customer.findOne(walletFilter).lean();
      return res.status(400).json({
        success: false,
        message: `Insufficient wallet balance. Available ₹${existingCustomer?.walletBalance || 0}, required ₹${amountNumber}.`,
      });
    }
  }

  const order = await Order.create({
    orderId: createOrderId(),
    address,
    latitude,
    longitude,
    planType,
    durationDays,
    mealsPerDay,
    totalMeals,
    perMealPrice,
    homeChefId,
    homeChefName,
    homeChefOwner,
    amount,
    chef: chef || homeChefName,
    customer: authenticatedCustomer,
    customerEmail: authenticatedEmail,
    customerPhone: authenticatedPhone,
    eta,
    items,
    meal,
    notes,
    orderType,
    paymentMethod,
    paymentProvider:
      paymentMethod === "Wallet" ? "Wallet" : paymentProvider || "Razorpay",
    paymentId: paymentMethod === "Wallet" ? `wallet_${Date.now()}` : paymentId,
    paymentStatus: paymentStatus || "Paid",
    source,
    status: status || "Order Confirmed",
  });
  notifyVendorNewOrder(order).catch((error) => {
    console.warn("[order] Vendor notification failed", error.message);
  });

  const customerFilter = authenticatedPhone
    ? {
        $or: [
          { phone: authenticatedPhone },
          { name: authenticatedCustomer },
          ...(authenticatedEmail
            ? [{ email: String(authenticatedEmail).toLowerCase().trim() }]
            : []),
        ],
      }
    : authenticatedEmail
      ? { email: String(authenticatedEmail).toLowerCase().trim() }
      : { name: authenticatedCustomer };
  await Customer.findOneAndUpdate(customerFilter, {
    $inc: { orders: 1 },
  }).catch(() => undefined);
  if (homeChefId) {
    await HomeChef.findByIdAndUpdate(homeChefId, { $inc: { orders: 1 } }).catch(
      () => undefined,
    );
  } else if (homeChefName || chef) {
    await HomeChef.findOneAndUpdate(
      { name: homeChefName || chef },
      { $inc: { orders: 1 } },
    ).catch(() => undefined);
  }

  if (orderType === "subscription") {
    const startDate = new Date();
    const renewalDate = durationDays
      ? new Date(
          startDate.getTime() + Number(durationDays) * 24 * 60 * 60 * 1000,
        )
      : null;

    const subscription = await Subscription.findOneAndUpdate(
      authenticatedPhone
        ? { customerPhone: authenticatedPhone }
        : { customer: authenticatedCustomer },
      {
        $set: {
          customer: authenticatedCustomer,
          customerEmail: authenticatedEmail,
          customerPhone: authenticatedPhone,
          plan: meal,
          planType,
          durationDays,
          totalMeals,
          mealsPerDay,
          pricePerMeal: perMealPrice,
          amount,
          homeChefId,
          homeChefName: homeChefName || chef,
          homeChefOwner,
          nextMeal: eta,
          skipped: "0",
          renewal: renewalDate
            ? renewalDate.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
              })
            : "Active",
          address,
          latitude,
          longitude,
          paymentMethod,
          paymentProvider:
            paymentMethod === "Wallet"
              ? "Wallet"
              : paymentProvider || "Razorpay",
          paymentId: paymentMethod === "Wallet" ? order.paymentId : paymentId,
          paymentStatus: paymentStatus || "Paid",
          orderId: order.orderId,
          startDate,
          endDate: renewalDate,
          status: "Active",
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );
    await syncCustomerActiveSubscription(subscription);
  }

  if (paymentMethod === "Wallet" && debitedWalletCustomer) {
    await WalletTransaction.create({
      customer: debitedWalletCustomer.name || authenticatedCustomer,
      type: "Payment",
      amount: `-₹${amountNumber}`,
      note: `${orderType === "subscription" ? "Subscription" : "Order"} payment · ${order.orderId}`,
    });
  }

  return sendSuccess(res, 201, "Order created successfully", { order });
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    orderId: req.params.orderId,
    ...buildOrderLookupFromUser(req.user),
  }).lean();

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }

  return sendSuccess(res, 200, "Order fetched", { order });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!trackingStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid order tracking status",
      statuses: trackingStatuses,
    });
  }

  const existingOrder = await Order.findOne({ orderId: req.params.orderId }).lean();

  if (!existingOrder) {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }

  if (status === "Accepted" && existingOrder.status === "Order Confirmed") {
    await enforceVendorDailyCapacity({
      ...existingOrder,
      statuses: ["Accepted", "Preparing", "Ready", "Out For Delivery", "Delivered"],
    });
  }

  const order = await Order.findOneAndUpdate(
    { orderId: req.params.orderId },
    { status },
    { returnDocument: "after", runValidators: true },
  ).lean();

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }

  notifyOrderStatusChange(order, status).catch((error) => {
    console.warn("[order-status] Push notification error:", error?.message);
  });

  return sendSuccess(res, 200, "Order tracking status updated", { order });
});

const assignVendorToOrder = asyncHandler(async (req, res) => {
  try {
  const {
    chef,
    homeChefId,
    homeChefName,
    homeChefOwner,
  } = req.body || {};

  if (!homeChefOwner && !homeChefName && !chef) {
    return res.status(400).json({
      success: false,
      message: "Vendor identity is required",
    });
  }

  const existingOrder = await Order.findOne({ orderId: req.params.orderId }).lean();

  if (!existingOrder) {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }

  if (existingOrder.status === "Delivered") {
    return res.status(409).json({
      success: false,
      message: "Delivered order cannot be reassigned.",
    });
  }

  const hasVendorAssignment = Boolean(
    existingOrder.homeChefId ||
      existingOrder.homeChefName ||
      existingOrder.homeChefOwner ||
      existingOrder.chef,
  );

  if (hasVendorAssignment) {
    return res.status(409).json({
      success: false,
      message: "Vendor already assigned to this order.",
    });
  }

  const vendorFilters = [
    homeChefOwner && /^[a-f\d]{24}$/i.test(String(homeChefOwner))
      ? { _id: homeChefOwner }
      : null,
    homeChefOwner && String(homeChefOwner).includes("@")
      ? { email: String(homeChefOwner).toLowerCase().trim() }
      : null,
    homeChefName ? { name: homeChefName } : null,
    homeChefName ? { "partnerProfile.kitchenName": homeChefName } : null,
    chef ? { name: chef } : null,
    chef ? { "partnerProfile.kitchenName": chef } : null,
  ].filter(Boolean);

  const vendor = vendorFilters.length
    ? await User.findOne({ role: "vendor", $or: vendorFilters }).lean()
    : null;

  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: "Vendor not found. Select an approved online kitchen.",
    });
  }

  if (vendor.partnerProfile?.kycStatus !== "Approved") {
    return res.status(409).json({
      success: false,
      message: "Vendor approval is required before assigning orders.",
    });
  }

  if (vendor && vendor.partnerProfile?.kitchenOpen === false) {
    return res.status(409).json({
      success: false,
      message: "Vendor kitchen is offline. Order cannot be assigned.",
    });
  }

  const order = await Order.findOneAndUpdate(
    { orderId: req.params.orderId },
    {
      ...(chef || homeChefName ? { chef: chef || homeChefName } : {}),
      homeChefId: String(vendor._id),
      homeChefName:
        vendor.partnerProfile?.kitchenName ||
        vendor.partnerProfile?.name ||
        vendor.name ||
        homeChefName ||
        chef,
      homeChefOwner: String(vendor._id),
      status: "Order Confirmed",
    },
    { returnDocument: "after", runValidators: true },
  ).lean();

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }

  const notificationResult = await notifyVendorNewOrder(order).catch((error) => {
    console.warn("[order-assignment] Vendor notification failed", {
      message: error?.message,
      orderId: order.orderId,
    });
    return { notification: null, pushed: false, error: error?.message };
  });

  return sendSuccess(res, 200, "Vendor assigned to order", {
    notification: notificationResult?.notification,
    notificationPushed: Boolean(notificationResult?.pushed),
    notificationReason: notificationResult?.reason || notificationResult?.error || "",
    order,
  });
  } catch (error) {
    return sendAssignmentError(res, error, "Vendor assignment");
  }
});

const assignRiderToOrder = asyncHandler(async (req, res) => {
  try {
  const {
    deliveryBatchId,
    deliverySequence,
    riderEmail,
    riderId,
    riderName,
    riderPhone,
  } = req.body || {};

  if (riderId && !/^[a-f\d]{24}$/i.test(String(riderId))) {
    return res.status(400).json({
      success: false,
      message: "Valid riderId is required",
    });
  }

  const riderFilters = [
    riderId ? { _id: riderId } : null,
    riderEmail ? { email: String(riderEmail).toLowerCase().trim() } : null,
    riderPhone ? { phone: String(riderPhone).trim() } : null,
  ].filter(Boolean);

  if (!riderFilters.length && !riderName) {
    return res.status(400).json({
      success: false,
      message: "Rider identity is required",
    });
  }

  const existingOrder = await Order.findOne({ orderId: req.params.orderId }).lean();

  if (!existingOrder) {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }

  if (existingOrder.status === "Delivered") {
    return res.status(409).json({
      success: false,
      message: "Delivered order cannot be reassigned.",
    });
  }

  const hasRiderAssignment = Boolean(
    existingOrder.riderId ||
      existingOrder.riderName ||
      existingOrder.riderEmail ||
      existingOrder.riderPhone ||
      existingOrder.deliveryPartnerName ||
      existingOrder.deliveryPartnerEmail ||
      existingOrder.deliveryPartnerPhone,
  );

  if (hasRiderAssignment) {
    return res.status(409).json({
      success: false,
      message: "Rider already assigned to this order.",
    });
  }

  const rider = riderFilters.length
    ? await User.findOne({ role: "rider", $or: riderFilters }).lean()
    : null;

  if (riderFilters.length && !rider) {
    return res.status(404).json({
      success: false,
      message: "Rider not found",
    });
  }

  if (rider && !rider.isActive) {
    return res.status(409).json({
      success: false,
      message: "Delivery partner account is inactive. Order cannot be assigned.",
    });
  }

  if (rider && rider.partnerProfile?.isOnline === false) {
    return res.status(409).json({
      success: false,
      message: "Delivery partner is offline. Order cannot be assigned.",
    });
  }

  const order = await Order.findOneAndUpdate(
    { orderId: req.params.orderId },
    {
      riderId: rider?._id ? String(rider._id) : String(riderId || ""),
      riderName: rider?.name || riderName || "",
      riderPhone: rider?.phone || riderPhone || "",
      riderEmail: rider?.email || riderEmail || "",
      ...(deliveryBatchId ? { deliveryBatchId } : {}),
      deliverySequence: Math.max(0, Number(deliverySequence || 0)),
      status: "Ready",
    },
    { returnDocument: "after", runValidators: true },
  ).lean();

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }

  const notificationResult = await notifyRiderNewAssignment(order).catch((error) => {
    console.warn("[order-assignment] Rider notification failed", {
      message: error?.message,
      orderId: order.orderId,
      riderId: order.riderId,
    });
    return { notification: null, pushed: false, error: error?.message };
  });

  return sendSuccess(res, 200, "Rider assigned to order", {
    notification: notificationResult?.notification,
    notificationPushed: Boolean(notificationResult?.pushed),
    notificationReason: notificationResult?.reason || notificationResult?.error || "",
    order,
  });
  } catch (error) {
    return sendAssignmentError(res, error, "Rider assignment");
  }
});

module.exports = {
  assignRiderToOrder,
  assignVendorToOrder,
  createOrder,
  getOrderById,
  getOrders,
  updateOrderStatus,
};
