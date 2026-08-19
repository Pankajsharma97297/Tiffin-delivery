const Category = require("../models/Category");
const Customer = require("../models/Customer");
const HomeChefChangeRequest = require("../models/HomeChefChangeRequest");
const HomeChefChangeSetting = require("../models/HomeChefChangeSetting");
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
const { buildMealsFromSchedule, dayOrder } = require("../utils/tiffinSchedule");

const weeklyMenuOrder = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const buildSubscriptionCustomerQuery = (customer) => {
  const matches = [];

  if (customer?.phone) {
    matches.push({ customerPhone: customer.phone });
  }
  if (customer?.email) {
    matches.push({ customerEmail: customer.email });
  }
  if (customer?.name) {
    matches.push({ customer: customer.name });
  }

  return matches.length ? { $or: matches } : {};
};

const activeSubscriptionQuery = (customer) => ({
  ...(Object.keys(buildSubscriptionCustomerQuery(customer)).length
    ? { $and: [buildSubscriptionCustomerQuery(customer)] }
    : {}),
  status: "Active",
  $or: [
    { endDate: { $exists: false } },
    { endDate: null },
    { endDate: { $gt: new Date() } },
  ],
});

const buildCustomerLookupFromRequest = (req) => {
  const identities = [
    req.user?.email ? { email: req.user.email } : null,
    req.user?.phone ? { phone: req.user.phone } : null,
  ].filter(Boolean);

  if (!identities.length) {
    return {};
  }

  return identities.length > 1 ? { $or: identities } : identities[0];
};

const buildOrderLookupFromCustomer = (customer) => {
  const identities = [
    customer?.email ? { customerEmail: customer.email } : null,
    customer?.phone ? { customerPhone: customer.phone } : null,
    customer?.name ? { customer: customer.name } : null,
  ].filter(Boolean);

  if (!identities.length) {
    return {};
  }

  return identities.length > 1 ? { $or: identities } : identities[0];
};

const getDistanceKm = (from, to) => {
  const fromLat = Number(from?.latitude);
  const fromLng = Number(from?.longitude);
  const toLat = Number(to?.latitude);
  const toLng = Number(to?.longitude);

  if (![fromLat, fromLng, toLat, toLng].every(Number.isFinite)) {
    return null;
  }

  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(toLat - fromLat);
  const dLng = toRad(toLng - fromLng);
  const lat1 = toRad(fromLat);
  const lat2 = toRad(toLat);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
};

const sortChefsByCustomerLocation = (customer, chefs) =>
  [...(chefs || [])]
    .map((chef) => {
      const distanceKm = getDistanceKm(customer, chef);

      return {
        ...chef,
        distance:
          distanceKm == null ? chef.distance : `${distanceKm.toFixed(1)} km`,
        distanceKm,
      };
    })
    .sort((first, second) => {
      if (first.distanceKm == null && second.distanceKm == null) {
        return Number(second.orders || 0) - Number(first.orders || 0);
      }
      if (first.distanceKm == null) {
        return 1;
      }
      if (second.distanceKm == null) {
        return -1;
      }

      return first.distanceKm - second.distanceKm;
    });

const normalizeWeeklyMenu = (menu) =>
  (Array.isArray(menu) ? menu : [])
    .map((item) => ({
      day: String(item.day || "")
        .toUpperCase()
        .slice(0, 3),
      icon: item.icon || "",
      title: item.title || item.meal || "",
      items: item.items || item.meta || "",
      mealType: item.mealType || "",
      price: item.price || "",
      isAvailable: item.isAvailable !== false,
    }))
    .filter((item) => weeklyMenuOrder.includes(item.day))
    .sort(
      (first, second) =>
        weeklyMenuOrder.indexOf(first.day) -
        weeklyMenuOrder.indexOf(second.day),
    );

const normalizeSampleMenu = (menu) =>
  (Array.isArray(menu) ? menu : [])
    .map((item) => ({
      icon: item.icon || "",
      title: item.title || item.name || "",
      items: item.items || item.description || "",
      price: item.price || "",
      isAvailable: item.isAvailable !== false,
    }))
    .filter((item) => item.title);

const defaultChangeSettings = {
  title: "Change HomeChef",
  subtitle: "Request a different HomeChef",
  description:
    "Not satisfied? You can request a HomeChef change. Subject to availability and admin approval.",
  sheetDescription:
    "Please let us know why you'd like to change your HomeChef. This helps us improve our service.",
  successMessage:
    "Your HomeChef change request is under review. Our team will assign a new HomeChef within 24 hours.",
  expectedResolution: "within 24 hours",
  reasons: [
    "Food quality not satisfactory",
    "Portion sizes too small",
    "Delivery frequently late",
    "Menu variety too limited",
    "Hygiene concerns",
    "Other reason",
  ],
  isEnabled: true,
};

const getChangeSettings = async () => {
  const settings = await HomeChefChangeSetting.findOne({
    key: "default",
  }).lean();
  return { ...defaultChangeSettings, ...(settings || {}) };
};

const expireElapsedSubscriptions = () =>
  Subscription.updateMany(
    { status: "Active", endDate: { $lte: new Date() } },
    { $set: { status: "Expired" } },
  );

const serializeHomeChef = (chef) =>
  chef
    ? {
        ...chef,
        weeklyMenu: normalizeWeeklyMenu(chef.weeklyMenu),
        sampleMenu: normalizeSampleMenu(chef.sampleMenu),
      }
    : null;

const getHomeData = asyncHandler(async (req, res) => {
  await expireElapsedSubscriptions();
  const [
    customer,
    meals,
    assignedChef,
    schedule,
    categories,
    nearbyChefs,
    products,
    changeSettings,
  ] = await Promise.all([
    Customer.findOne(buildCustomerLookupFromRequest(req))
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean(),
    Meal.find().lean(),
    HomeChef.findOne({ isAssigned: true }).lean(),
    ScheduleItem.find().sort({ sortOrder: 1 }).lean(),
    Category.find({ isActive: true }).sort({ sortOrder: 1 }).lean(),
    HomeChef.find({ status: { $ne: "Inactive" } })
      .sort({ orders: -1 })
      .lean(),
    Product.find({ status: { $ne: "Inactive" } })
      .sort({ createdAt: -1 })
      .lean(),
    getChangeSettings(),
  ]);
  const activeOrder = await Order.findOne({
    ...buildOrderLookupFromCustomer(customer),
    status: { $ne: "Delivered" },
  })
    .sort({ createdAt: -1 })
    .lean();
  const currentCustomerFilter = customer?.phone
    ? { customerPhone: customer.phone }
    : customer?.name
      ? { customerName: customer.name }
      : {};
  const [
    activeSubscription,
    latestChangeRequest,
    latestApprovedAssignedRequest,
  ] = await Promise.all([
    Subscription.findOne(activeSubscriptionQuery(customer))
      .sort({ updatedAt: -1 })
      .lean(),
    HomeChefChangeRequest.findOne(currentCustomerFilter)
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean(),
    HomeChefChangeRequest.findOne({
      ...currentCustomerFilter,
      status: { $in: ["Approved", "Assigned"] },
      assignedChefId: { $exists: true, $ne: null },
    })
      .sort({ updatedAt: -1 })
      .lean(),
  ]);
  const nearbyChefsByDistance = sortChefsByCustomerLocation(
    customer,
    nearbyChefs,
  );
  const nearestChef = nearbyChefsByDistance[0] || null;
  const [approvedAssignedChef, currentRequestChef] = await Promise.all([
    latestApprovedAssignedRequest?.assignedChefId
      ? HomeChef.findById(latestApprovedAssignedRequest.assignedChefId).lean()
      : null,
    latestChangeRequest?.currentChefId
      ? HomeChef.findById(latestChangeRequest.currentChefId).lean()
      : null,
  ]);
  const effectiveAssignedChef =
    approvedAssignedChef ||
    nearestChef ||
    assignedChef ||
    currentRequestChef ||
    nearbyChefsByDistance?.[0] ||
    null;

  const mealsByType = meals.reduce((acc, meal) => {
    acc[meal.type] = meal;
    return acc;
  }, {});
  const assignedWeeklyMenu = normalizeWeeklyMenu(
    effectiveAssignedChef?.weeklyMenu,
  );
  const assignedChefName = effectiveAssignedChef
    ? [effectiveAssignedChef.owner, effectiveAssignedChef.name]
        .filter(Boolean)
        .join(" · ")
    : "";
  const assignedSchedule = assignedWeeklyMenu.map((item) => ({
    day: item.day,
    icon: item.icon,
    meal: item.title,
    title: item.title,
    mealType: item.mealType,
    meta: [item.mealType, item.items || item.price].filter(Boolean).join(" · "),
    chef: assignedChefName,
    status: "",
    sortOrder: dayOrder.indexOf(item.day),
  }));

  const dynamicSchedule = buildMealsFromSchedule(
    assignedSchedule.length ? assignedSchedule : schedule,
    mealsByType,
  );
  const hasActiveSubscription = Boolean(activeSubscription);

  const homeData = {
    customer,
    meals: hasActiveSubscription
      ? dynamicSchedule.meals
      : {
          today: null,
          next: null,
          tomorrow: null,
        },
    assignedChef: hasActiveSubscription && effectiveAssignedChef
      ? {
          _id: effectiveAssignedChef._id,
          image: effectiveAssignedChef.image,
          label: "Your Assigned HomeChef",
          name: [effectiveAssignedChef.owner, effectiveAssignedChef.name]
            .filter(Boolean)
            .join(" · "),
          kitchenName: effectiveAssignedChef.name,
          owner: effectiveAssignedChef.owner,
          badge: effectiveAssignedChef.badge,
          cuisine: effectiveAssignedChef.cuisine,
          tags: effectiveAssignedChef.tags,
          rating: effectiveAssignedChef.rating
            ? `★ ${effectiveAssignedChef.rating}`
            : "",
          ratingValue: effectiveAssignedChef.rating,
          reviewCount: effectiveAssignedChef.reviewCount,
          distance: effectiveAssignedChef.distance,
          location: effectiveAssignedChef.location,
          address: effectiveAssignedChef.address,
          liveAddress: effectiveAssignedChef.liveAddress,
          latitude: effectiveAssignedChef.latitude,
          longitude: effectiveAssignedChef.longitude,
          time: effectiveAssignedChef.time,
          experience: effectiveAssignedChef.experience,
          subscribers: effectiveAssignedChef.subscribers,
          price: effectiveAssignedChef.price,
          about: effectiveAssignedChef.about,
          fssaiStatus: effectiveAssignedChef.fssaiStatus,
          foodType: effectiveAssignedChef.foodType,
          achievement: effectiveAssignedChef.achievement,
          hygieneRating: effectiveAssignedChef.hygieneRating,
          status: effectiveAssignedChef.status,
          weeklyMenu: assignedWeeklyMenu,
          sampleMenu: normalizeSampleMenu(effectiveAssignedChef.sampleMenu),
        }
      : null,
    schedule: hasActiveSubscription ? dynamicSchedule.schedule || [] : [],
    categories: categories || [],
    nearbyChefs: nearbyChefsByDistance?.length
      ? nearbyChefsByDistance.map(serializeHomeChef).filter(Boolean)
      : [],
    products: products || [],
    activeOrder,
    activeSubscription,
    homeChefChange: {
      settings: changeSettings,
      latestRequest: latestChangeRequest,
    },
  };

  return sendSuccess(res, 200, "Home data fetched", homeData);
});

const submitHomeChefChangeRequest = asyncHandler(async (req, res) => {
  const { reason, note, chefId, chefName, requestedChefId, requestedChefName } =
    req.body;

  if (!reason) {
    return res.status(400).json({
      success: false,
      message: "Reason is required",
    });
  }

  const settings = await getChangeSettings();

  if (!settings.isEnabled) {
    return res.status(403).json({
      success: false,
      message: "HomeChef change requests are disabled right now",
    });
  }

  const customer = await Customer.findOne(buildCustomerLookupFromRequest(req))
    .sort({ updatedAt: -1, createdAt: -1 })
    .lean();

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: "Authenticated customer not found",
    });
  }

  const customerName = customer?.name || "";
  const customerPhone = customer?.phone || "";
  const requestFilter = customerPhone ? { customerPhone } : { customerName };
  const existingRequest =
    await HomeChefChangeRequest.findOne(requestFilter).lean();
  const assignedChef =
    (chefId ? await HomeChef.findById(chefId).lean() : null) ||
    (await HomeChef.findOne({ isAssigned: true }).lean()) ||
    (existingRequest?.currentChefId
      ? await HomeChef.findById(existingRequest.currentChefId).lean()
      : null) ||
    (await HomeChef.findOne({ status: { $ne: "Inactive" } })
      .sort({ orders: -1 })
      .lean());
  const requestedChef = requestedChefId
    ? await HomeChef.findById(requestedChefId).lean()
    : null;
  const request = await HomeChefChangeRequest.findOneAndUpdate(
    requestFilter,
    {
      $set: {
        customerName,
        customerPhone,
        currentChefId: assignedChef?._id,
        currentChefName: chefName || assignedChef?.name || "",
        requestedChefId: requestedChef?._id || null,
        requestedChefName: requestedChefName || requestedChef?.name || "",
        reason,
        note,
        status: "Pending Admin Approval",
        adminNote: "",
      },
      $unset: {
        assignedChefId: "",
        assignedChefName: "",
      },
      $setOnInsert: {
        requestId: `HCR${Date.now().toString().slice(-8)}`,
      },
    },
    {
      new: true,
      runValidators: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );

  return sendSuccess(res, 201, "HomeChef change request submitted", {
    request,
    settings,
  });
});

const submitSubscriptionRequest = asyncHandler(async (req, res) => {
  const {
    currentAddress,
    mealDate,
    mealTitle,
    newAddress,
    reason,
    requestType,
    subscriptionId,
  } = req.body;

  if (!["skip_meal", "location_change"].includes(requestType)) {
    return res.status(400).json({
      success: false,
      message: "Valid request type is required",
    });
  }

  if (requestType === "skip_meal" && (!mealDate || !reason)) {
    return res.status(400).json({
      success: false,
      message: "Meal date and reason are required to skip a meal",
    });
  }

  if (requestType === "location_change" && !newAddress) {
    return res.status(400).json({
      success: false,
      message: "New delivery address is required",
    });
  }

  const customer = await Customer.findOne(buildCustomerLookupFromRequest(req))
    .sort({ updatedAt: -1, createdAt: -1 })
    .lean();

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: "Authenticated customer not found",
    });
  }

  const subscription = subscriptionId
    ? await Subscription.findById(subscriptionId)
    : await Subscription.findOne(activeSubscriptionQuery(customer)).sort({
        updatedAt: -1,
      });

  if (!subscription) {
    return res.status(404).json({
      success: false,
      message: "Active subscription not found",
    });
  }

  const request = await SubscriptionRequest.create({
    customer: customer?.name || subscription.customer || "",
    customerEmail: customer?.email || subscription.customerEmail,
    customerPhone: customer?.phone || subscription.customerPhone,
    subscriptionId: String(subscription._id),
    requestType,
    mealDate: mealDate ? new Date(mealDate) : undefined,
    mealTitle,
    reason,
    currentAddress: currentAddress || subscription.address,
    newAddress,
    status: requestType === "skip_meal" ? "Approved" : "Pending Admin Approval",
  });

  if (requestType === "skip_meal") {
    const currentSkipped = Number(subscription.skipped || 0) || 0;
    const currentEndDate = subscription.endDate
      ? new Date(subscription.endDate)
      : null;
    const nextEndDate = currentEndDate
      ? new Date(currentEndDate.getTime() + 24 * 60 * 60 * 1000)
      : currentEndDate;

    subscription.skipped = String(currentSkipped + 1);
    if (nextEndDate) {
      subscription.endDate = nextEndDate;
      subscription.renewal = nextEndDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      });
    }
    await subscription.save();
  }

  return sendSuccess(res, 201, "Subscription request submitted", {
    request,
    subscription,
  });
});

const assignScheduleMeal = asyncHandler(async (req, res) => {
  const { day } = req.params;
  const dayKey = String(day || "")
    .toUpperCase()
    .slice(0, 3);

  if (!dayOrder.includes(dayKey)) {
    return res.status(400).json({
      success: false,
      message: "Invalid day. Use SUN, MON, TUE, WED, THU, FRI or SAT",
      days: dayOrder,
    });
  }

  const payload = {
    ...req.body,
    day: dayKey,
    meal: req.body.meal || req.body.title,
    title: req.body.title || req.body.meal,
    sortOrder: dayOrder.indexOf(dayKey),
  };

  const scheduleItem = await ScheduleItem.findOneAndUpdate(
    { day: dayKey },
    { $set: payload },
    {
      returnDocument: "after",
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );

  return sendSuccess(res, 200, "Schedule meal assigned", { scheduleItem });
});

const getAdminDashboard = asyncHandler(async (req, res) => {
  const [
    orders,
    subscriptions,
    chefs,
    customers,
    plans,
    walletTransactions,
    reviews,
    supportTickets,
    notifications,
    products,
    scheduleItems,
  ] = await Promise.all([
    Order.find().sort({ createdAt: -1 }).lean(),
    Subscription.find().lean(),
    HomeChef.find().lean(),
    Customer.find().lean(),
    Plan.find().lean(),
    WalletTransaction.find().lean(),
    Review.find().lean(),
    SupportTicket.find().lean(),
    Notification.find().lean(),
    Product.find().sort({ createdAt: -1 }).lean(),
    ScheduleItem.find().sort({ sortOrder: 1 }).lean(),
  ]);

  const totalRevenue = orders.reduce((sum, order) => {
    const amount = Number(String(order.amount || "").replace(/[^\d.-]/g, ""));
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);

  const adminDashboard = {
    metrics: [
      {
        label: "Today Orders",
        value: String(orders.length),
        delta: "+18%",
        tone: "green",
      },
      {
        label: "Active Subscriptions",
        value: String(subscriptions.length),
        delta: "+7%",
        tone: "green",
      },
      {
        label: "Revenue Today",
        value: `₹${totalRevenue.toLocaleString("en-IN")}`,
        delta: "+12%",
        tone: "green",
      },
      {
        label: "Open Tickets",
        value: String(supportTickets.length),
        delta: "-9%",
        tone: "orange",
      },
    ],
    orders: orders.map((order) => ({
      id: order.orderId,
      customer: order.customer,
      meal: order.meal,
      chef: order.chef,
      status: order.status,
      amount: order.amount,
      eta: order.eta,
      address: order.address,
      orderType: order.orderType,
      paymentMethod: order.paymentMethod,
      paymentProvider: order.paymentProvider,
      paymentId: order.paymentId,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    })),
    subscriptions,
    chefs,
    customers: customers.map((customer) => ({
      _id: customer._id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      source: customer.authProvider || "local",
      location: customer.location,
      address: customer.address,
      liveAddress: customer.liveAddress,
      latitude: customer.latitude,
      longitude: customer.longitude,
      walletBalance: customer.walletBalance,
      wallet: `₹${customer.walletBalance}`,
      orders: customer.orders,
    })),
    plans,
    walletTransactions,
    reviews,
    supportTickets,
    notifications,
    products,
    scheduleItems,
  };

  return sendSuccess(res, 200, "Admin dashboard fetched", adminDashboard);
});

module.exports = {
  assignScheduleMeal,
  getAdminDashboard,
  getHomeData,
  submitHomeChefChangeRequest,
  submitSubscriptionRequest,
};
