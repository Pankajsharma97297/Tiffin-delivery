const Category = require("../models/Category");
const { getCommissionSetting } = require("./commissionController");
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
const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { buildMealsFromSchedule, dayOrder } = require("../utils/tiffinSchedule");
const {
  getActiveCommissionRates,
  parseMoney,
  partnerShare,
} = require("../utils/partnerEarnings");

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
    newLatitude,
    newLongitude,
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
    newLatitude:
      newLatitude === undefined || newLatitude === null || newLatitude === ""
        ? undefined
        : Number(newLatitude),
    newLongitude:
      newLongitude === undefined || newLongitude === null || newLongitude === ""
        ? undefined
        : Number(newLongitude),
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

const formatMoney = (value) => `₹${Math.round(value).toLocaleString("en-IN")}`;

const getAdminDashboard = asyncHandler(async (req, res) => {
  await expireElapsedSubscriptions();

  let [
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
    partnerUsers,
    commissionSetting,
  ] = await Promise.all([
    Order.find().sort({ createdAt: -1 }).lean(),
    Subscription.find().sort({ createdAt: -1 }).lean(),
    HomeChef.find().lean(),
    Customer.find().lean(),
    Plan.find().lean(),
    WalletTransaction.find().lean(),
    Review.find().lean(),
    SupportTicket.find().lean(),
    Notification.find().lean(),
    Product.find().sort({ createdAt: -1 }).lean(),
    ScheduleItem.find().sort({ sortOrder: 1 }).lean(),
    User.find({ role: { $in: ["vendor", "rider", "customer"] } })
      .sort({ updatedAt: -1, createdAt: -1 })
      .select("-password")
      .lean(),
    getCommissionSetting(),
  ]);

  // Merge customer user accounts if not present in customer docs
  const customerList = [...(customers || [])];
  const customerPhones = new Set(customerList.map(c => String(c.phone || "").trim()).filter(Boolean));
  const customerEmails = new Set(customerList.map(c => String(c.email || "").toLowerCase().trim()).filter(Boolean));

  (partnerUsers || []).filter(u => u.role === "customer").forEach(u => {
    const phone = String(u.phone || "").trim();
    const email = String(u.email || "").toLowerCase().trim();
    const hasMatch = (phone && customerPhones.has(phone)) || (email && customerEmails.has(email));
    if (!hasMatch) {
      customerList.push({
        _id: u._id,
        name: u.name || "MIDDO Customer",
        avatar: u.avatar || u.partnerProfile?.avatar || "",
        phone: u.phone,
        email: u.email,
        authProvider: u.authProvider || "local",
        location: u.city || "",
        address: u.address || u.partnerProfile?.address || "",
        liveAddress: u.partnerProfile?.liveAddress || u.address || "",
        latitude: u.partnerProfile?.latitude,
        longitude: u.partnerProfile?.longitude,
        walletBalance: 0,
        orders: 0,
      });
      if (phone) customerPhones.add(phone);
      if (email) customerEmails.add(email);
    }
  });

  // Merge vendor/homechef user accounts if not present in chefs
  const chefList = [...(chefs || [])];
  const chefNames = new Set(chefList.map(c => String(c.name || '').toLowerCase().trim()).filter(Boolean));
  const chefEmails = new Set(chefList.map(c => String(c.email || '').toLowerCase().trim()).filter(Boolean));
  const chefIds = new Set(chefList.map(c => String(c._id || '')).filter(Boolean));

  (partnerUsers || []).filter(u => u.role === "vendor").forEach(u => {
    const profile = u.partnerProfile || {};
    const kitchenName = profile.kitchenName || profile.name || u.name;
    const email = String(u.email || profile.email || '').toLowerCase().trim();
    const cleanKitchen = String(kitchenName || '').toLowerCase().trim();
    const userId = String(u._id || '');

    if (!chefIds.has(userId) && (!cleanKitchen || !chefNames.has(cleanKitchen)) && (!email || !chefEmails.has(email))) {
      chefList.push({
        _id: u._id,
        name: kitchenName,
        owner: profile.owner || profile.name || u.name,
        email: u.email || profile.email || "",
        avatar: profile.avatar || u.avatar || "",
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
        rating: profile.rating || "4.8",
        orders: profile.orders || 0,
        status: u.isActive ? (profile.kycStatus === "Approved" ? "Active" : "Review") : "Inactive",
      });
      if (cleanKitchen) chefNames.add(cleanKitchen);
      if (email) chefEmails.add(email);
      if (userId) chefIds.add(userId);
    }
  });

  // Calculate REAL order counts and REAL ratings for every chef in chefList from DB orders & reviews
  const populatedChefList = chefList.map(chef => {
    const matchingVendor = (partnerUsers || []).find(user => {
      const profile = user.partnerProfile || {};
      const identities = [
        user._id,
        user.email,
        user.name,
        profile.email,
        profile.name,
        profile.kitchenName,
      ].map(value => String(value || '').toLowerCase().trim()).filter(Boolean);
      const chefIdentities = [chef._id, chef.email, chef.name, chef.owner]
        .map(value => String(value || '').toLowerCase().trim())
        .filter(Boolean);

      return chefIdentities.some(identity => identities.includes(identity));
    });

    const chefIdentifiers = [
      String(chef._id || "").toLowerCase(),
      String(chef.name || "").toLowerCase(),
      String(chef.owner || "").toLowerCase(),
      String(chef.email || "").toLowerCase(),
    ].filter(Boolean);

    // Calculate real orders assigned to this chef from Order collection
    const matchingOrders = (orders || []).filter(order => {
      const orderChefIds = [
        order.homeChefId,
        order.homeChefName,
        order.homeChefOwner,
        order.chef,
      ].map(v => String(v || "").toLowerCase().trim()).filter(Boolean);
      return orderChefIds.some(id => chefIdentifiers.includes(id));
    });

    const realOrdersCount = Math.max(Number(chef.orders || 0), matchingOrders.length);

    // Calculate real average rating from reviews collection
    const chefReviews = (reviews || []).filter(r => {
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
      avatar: chef.avatar || matchingVendor?.partnerProfile?.avatar || matchingVendor?.avatar || '',
      orders: realOrdersCount,
      rating: realRating,
    };
  });

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);
  const todayOrders = orders.filter((order) => {
    const createdAt = order.createdAt ? new Date(order.createdAt) : null;
    return createdAt && createdAt >= startOfToday && createdAt < endOfToday;
  });
  const totalRevenue = orders.reduce((sum, order) => sum + parseMoney(order.amount), 0);
  const todayRevenue = todayOrders.reduce((sum, order) => sum + parseMoney(order.amount), 0);
  const paidRevenue = orders
    .filter((order) => String(order.paymentStatus || "Paid").toLowerCase() === "paid")
    .reduce((sum, order) => sum + parseMoney(order.amount), 0);
  const todayPaidRevenue = todayOrders
    .filter((order) => String(order.paymentStatus || "Paid").toLowerCase() === "paid")
    .reduce((sum, order) => sum + parseMoney(order.amount), 0);
  const refundTotal = walletTransactions
    .filter((transaction) => /refund/i.test(String(transaction.type || transaction.note || "")))
    .reduce((sum, transaction) => sum + parseMoney(transaction.amount), 0);
  const activeSubscriptions = subscriptions.filter(
    (subscription) => String(subscription.status || "Active") === "Active",
  );
  const skippedMeals = subscriptions.reduce(
    (sum, subscription) => sum + (Number(subscription.skipped || 0) || 0),
    0,
  );
  const pendingPayments = orders.filter(
    (order) => String(order.paymentStatus || "Paid").toLowerCase() !== "paid",
  ).length;
  const commissionRates = getActiveCommissionRates(commissionSetting);
  const vendorCommissionRate = commissionRates.vendorCommissionPercent;
  const riderCommissionRate = commissionRates.riderCommissionPercent;

  const adminDashboard = {
    metrics: [
      {
        label: "Today Orders",
        value: String(todayOrders.length),
        delta: `${orders.filter((order) => order.status !== "Delivered").length} live total`,
        tone: "green",
      },
      {
        label: "Active Subscriptions",
        value: String(activeSubscriptions.length),
        delta: `${subscriptions.length} total`,
        tone: "green",
      },
      {
        label: "Revenue Today",
        value: formatMoney(todayRevenue),
        delta: `${pendingPayments} pending payments`,
        tone: "green",
      },
      {
        label: "Open Tickets",
        value: String(supportTickets.length),
        delta: `${supportTickets.filter((ticket) => ticket.status !== "Closed").length} unresolved`,
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
      homeChefId: order.homeChefId,
      homeChefName: order.homeChefName,
      homeChefOwner: order.homeChefOwner,
      orderType: order.orderType,
      riderId: order.riderId,
      riderName: order.riderName,
      riderPhone: order.riderPhone,
      riderEmail: order.riderEmail,
      deliveryPartnerName: order.riderName,
      deliveryPartnerPhone: order.riderPhone,
      deliveryPartnerEmail: order.riderEmail,
      deliveryBatchId: order.deliveryBatchId,
      deliverySequence: order.deliverySequence,
      paymentMethod: order.paymentMethod,
      paymentProvider: order.paymentProvider,
      paymentId: order.paymentId,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    })),
    subscriptions,
    chefs: populatedChefList,
    customers: customerList.map((customer) => ({
      _id: customer._id,
      name: customer.name,
      avatar: customer.avatar || "",
      phone: customer.phone,
      email: customer.email,
      source: customer.authProvider || "local",
      location: customer.location,
      address: customer.address,
      liveAddress: customer.liveAddress,
      latitude: customer.latitude,
      longitude: customer.longitude,
      walletBalance: customer.walletBalance || 0,
      wallet: `₹${customer.walletBalance || 0}`,
      orders: customer.orders || 0,
    })),
    plans,
    walletTransactions,
    commissionSettings: {
      vendorCommissionPercent: vendorCommissionRate,
      riderCommissionPercent: riderCommissionRate,
      isActive: commissionSetting?.isActive !== false,
      updatedAt: commissionSetting?.updatedAt,
      updatedBy: commissionSetting?.updatedBy || "",
    },
    reports: {
      sales: [
        { label: "Today Sales", value: formatMoney(todayRevenue), note: `${todayOrders.length} orders created today` },
        { label: "Total Sales", value: formatMoney(totalRevenue), note: `${orders.length} total orders` },
        { label: "Today Paid Online", value: formatMoney(todayPaidRevenue), note: "UPI/Card/Net Banking/Wallet" },
        { label: "Total Paid Online", value: formatMoney(paidRevenue), note: "All paid online/wallet orders" },
        { label: "Refunds", value: formatMoney(refundTotal), note: "Wallet refund transactions" },
      ],
      subscriptions: [
        { label: "Active", value: String(activeSubscriptions.length), note: "Live customer plans" },
        { label: "Expired", value: String(subscriptions.filter((item) => item.status === "Expired").length), note: "Completed/cancelled plans" },
        { label: "Skipped Meals", value: String(skippedMeals), note: "Calendar skip usage" },
      ],
      commission: [
        { label: "Vendor Commission Rate", value: `${vendorCommissionRate}%`, note: "Set by admin" },
        { label: "Rider Commission Rate", value: `${riderCommissionRate}%`, note: "Set by admin" },
        { label: "Paid Revenue Base", value: formatMoney(paidRevenue), note: "Real paid order amount" },
      ],
      vendorPerformance: [],
      riderPerformance: [],
    },
    reviews,
    supportTickets,
    notifications,
    products,
    scheduleItems,
    vendors: partnerUsers
      .filter((user) => user.role === "vendor")
      .map((user) => {
        const profile = user.partnerProfile || {};
        const vendorOrders = orders.filter((order) => {
          const identities = [
            order.homeChefId,
            order.homeChefName,
            order.homeChefOwner,
            order.chef,
          ].map((value) => String(value || "").toLowerCase());
          return (
            identities.includes(String(user._id).toLowerCase()) ||
            identities.includes(String(user.name || "").toLowerCase()) ||
            identities.includes(String(profile.name || "").toLowerCase())
          );
        });
        const acceptedOrders = vendorOrders.filter((order) =>
          ["Accepted", "Preparing", "Ready", "Out For Delivery", "Delivered"].includes(
            order.status,
          ),
        ).length;
        const dailyCapacity = Number(profile.dailyCapacity || 150);

        return {
          _id: user._id,
          name: profile.name || user.name,
          email: profile.email || user.email,
          phone: profile.phone || user.phone,
          avatar: profile.avatar || user.avatar,
          city: profile.city || "",
          pincode: profile.pincode || "",
          status: user.isActive && profile.kycStatus === "Approved" ? "Approved" : "Pending Approval",
          kycStatus: profile.kycStatus || "Not Submitted",
          kycDocuments: profile.kycDocuments || [],
          kycSubmittedAt: profile.kycSubmittedAt,
          kycReviewedAt: profile.kycReviewedAt,
          kycReviewNote: profile.kycReviewNote || "",
          kitchenOpen: profile.kitchenOpen !== false,
          isOnline: profile.kitchenOpen !== false,
          dailyCapacity,
          acceptedOrders,
          remainingCapacity: Math.max(0, dailyCapacity - acceptedOrders),
          earnings: vendorOrders.reduce(
            (sum, order) => sum + partnerShare(order.amount, vendorCommissionRate),
            0,
          ),
          commission: vendorOrders.reduce(
            (sum, order) => sum + partnerShare(order.amount, vendorCommissionRate),
            0,
          ),
          orders: vendorOrders.length,
          sampleMenu: profile.sampleMenu || [],
          weeklyMenu: profile.weeklyMenu || [],
          photos: profile.photos || [],
        };
      }),
    riders: partnerUsers
      .filter((user) => user.role === "rider")
      .map((user) => {
        const profile = user.partnerProfile || {};
        const riderOrders = orders
          .filter(
            (order) =>
              String(order.riderId || "") === String(user._id) ||
              String(order.riderEmail || "").toLowerCase() ===
                String(user.email || "").toLowerCase() ||
              String(order.riderPhone || "") === String(user.phone || ""),
          )
          .sort(
            (left, right) =>
              Number(left.deliverySequence || 0) - Number(right.deliverySequence || 0),
          );

        return {
          _id: user._id,
          name: profile.name || user.name,
          email: profile.email || user.email,
          phone: profile.phone || user.phone,
          avatar: profile.avatar || user.avatar,
          city: profile.city || "",
          status: user.isActive ? "Active" : "Inactive",
          kycStatus: profile.kycStatus || "Not Submitted",
          kycDocuments: profile.kycDocuments || [],
          kycSubmittedAt: profile.kycSubmittedAt,
          kycReviewedAt: profile.kycReviewedAt,
          kycReviewNote: profile.kycReviewNote || "",
          isOnline: profile.isOnline !== false,
          assignedDeliveries: riderOrders.filter((order) => order.status !== "Delivered")
            .length,
          completedDeliveries: riderOrders.filter((order) => order.status === "Delivered")
            .length,
          earnings: riderOrders.reduce(
            (sum, order) => sum + partnerShare(order.amount, riderCommissionRate),
            0,
          ),
          commission: riderOrders.reduce(
            (sum, order) => sum + partnerShare(order.amount, riderCommissionRate),
            0,
          ),
          currentBatch: riderOrders[0]?.deliveryBatchId || "",
          route: riderOrders.map((order) => ({
            orderId: order.orderId,
            customer: order.customer,
            address: order.address,
            status: order.status,
            sequence: order.deliverySequence || 0,
          })),
        };
      }),
  };

  adminDashboard.reports.vendorPerformance = adminDashboard.vendors
    .map((vendor) => ({
      label: vendor.name || "-",
      value: `${vendor.orders || 0} orders`,
      note: `Payout ${formatMoney(vendor.earnings || 0)} · Rate ${vendorCommissionRate}%`,
    }))
    .slice(0, 8);
  adminDashboard.reports.riderPerformance = adminDashboard.riders
    .map((rider) => ({
      label: rider.name || "-",
      value: `${rider.completedDeliveries || 0} delivered`,
      note: `Assigned ${rider.assignedDeliveries || 0} · Payout ${formatMoney(rider.commission || 0)}`,
    }))
    .slice(0, 8);
  const totalVendorCommission = adminDashboard.vendors.reduce(
    (sum, vendor) => sum + (Number(vendor.commission || 0) || 0),
    0,
  );
  const totalRiderCommission = adminDashboard.riders.reduce(
    (sum, rider) => sum + (Number(rider.commission || 0) || 0),
    0,
  );
  adminDashboard.reports.commission = [
    { label: "Vendor Commission Rate", value: `${vendorCommissionRate}%`, note: "Vendor payout share set by admin" },
    { label: "Vendor Payout Total", value: formatMoney(totalVendorCommission), note: "Amount vendors receive from assigned orders" },
    { label: "Rider Commission Rate", value: `${riderCommissionRate}%`, note: "Rider payout share set by admin" },
    { label: "Rider Payout Total", value: formatMoney(totalRiderCommission), note: "Amount riders receive from assigned deliveries" },
    { label: "Paid Revenue Base", value: formatMoney(paidRevenue), note: "Real paid order amount" },
  ];

  return sendSuccess(res, 200, "Admin dashboard fetched", adminDashboard);
});

module.exports = {
  assignScheduleMeal,
  getAdminDashboard,
  getHomeData,
  submitHomeChefChangeRequest,
  submitSubscriptionRequest,
};
