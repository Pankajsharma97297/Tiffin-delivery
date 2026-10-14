const User = require("../models/User");
const Notification = require("../models/Notification");
const Order = require("../models/Order");
const { admin } = require("../config/firebaseAdmin");

const buildVendorFilters = (order = {}) => {
  const filters = [];
  const owner = String(order.homeChefOwner || "").trim();
  const chefId = String(order.homeChefId || "").trim();

  if (owner && /^[a-f\d]{24}$/i.test(owner)) {
    filters.push({ _id: owner });
  }

  if (chefId && /^[a-f\d]{24}$/i.test(chefId)) {
    filters.push({ _id: chefId });
  }

  if (owner && owner.includes("@")) {
    filters.push({ email: owner.toLowerCase() });
  }

  [order.homeChefName, order.chef, order.homeChefOwner].forEach((name) => {
    const cleanName = String(name || "").trim();
    if (cleanName && cleanName.length > 1) {
      filters.push({ name: cleanName });
      filters.push({ "partnerProfile.name": cleanName });
      filters.push({ "partnerProfile.kitchenName": cleanName });
    }
  });

  return filters;
};

const sendPush = async ({ data = {}, token, body, title }) => {
  if (!token) {
    return { pushed: false, reason: "No push token provided" };
  }

  let messaging;

  try {
    messaging = admin.messaging();
  } catch (error) {
    console.warn("[partner-notification] Firebase messaging unavailable", {
      message: error?.message,
    });
    return {
      pushed: false,
      reason: "Firebase messaging unavailable",
    };
  }

  try {
    await messaging.send({
      token,
      notification: { title, body },
      android: {
        priority: 'high',
        notification: {
          channelId: 'middo_partner_orders',
          sound: 'default',
          priority: 'high',
          defaultSound: true,
          defaultVibrateTimings: true,
          visibility: 'public',
        },
      },
      apns: {
        headers: {
          'apns-priority': '10',
        },
        payload: {
          aps: {
            sound: "default",
            badge: 1,
            contentAvailable: true,
          },
        },
      },
      data: Object.entries(data).reduce((payload, [key, value]) => {
        payload[key] = String(value ?? "");
        return payload;
      }, {}),
    });

    return {
      pushed: true,
      reason: "",
    };
  } catch (error) {
    console.warn("[partner-notification] FCM send error", error?.message);
    return {
      pushed: false,
      code: error?.code || "",
      reason: error?.message || "FCM send failed",
    };
  }
};

const clearInvalidPushToken = async (user, token, pushResult) => {
  if (!user?._id || !token) {
    return;
  }

  const reason = `${pushResult?.code || ""} ${pushResult?.reason || ""}`;
  if (!/registration-token-not-registered|invalid-registration-token|invalid-argument/i.test(reason)) {
    return;
  }

  await User.updateOne(
    { _id: user._id },
    {
      $unset: {
        pushToken: "",
        "partnerProfile.pushToken": "",
      },
    },
  ).catch(() => undefined);
};

const getVendorForOrder = async (order = {}) => {
  const filters = buildVendorFilters(order);

  if (!filters.length) {
    return null;
  }

  return User.findOne({
    role: { $in: ["vendor", "homechefs"] },
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
      role: { $in: ["vendor", "homechefs"] },
      $or: filters,
    }).lean();
  }

  const notification = await Notification.create({
    title,
    body,
    audience: "Vendors",
    category: "orderUpdates",
    orderId: order.orderId,
    recipientId: vendor?._id ? String(vendor._id) : String(order.homeChefOwner || order.homeChefId || ""),
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
    return { notification, pushed: false, reason: "Vendor push token missing" };
  }

  const pushResult = await sendPush({
    token,
    title,
    body,
    data: {
      orderId: order.orderId,
      type: "vendor_order_assigned",
      screen: "orders",
    },
  });
  await clearInvalidPushToken(vendor, token, pushResult);

  return {
    notification,
    pushed: pushResult === true || pushResult?.pushed === true,
    reason: pushResult?.reason || "",
  };
};

const notifyRiderNewAssignment = async (order = {}) => {
  const title = "New delivery assigned";
  const body = `Pickup ${order.meal || "order"} from ${order.homeChefName || order.chef || "vendor"} for ${order.customer || "customer"}.`;
  const riderFilters = [
    order.riderId ? { _id: order.riderId } : null,
    order.riderEmail ? { email: String(order.riderEmail).toLowerCase().trim() } : null,
    order.riderPhone ? { phone: String(order.riderPhone).trim() } : null,
    order.riderName ? { name: String(order.riderName).trim() } : null,
  ].filter(Boolean);
  const rider = riderFilters.length
    ? await User.findOne({ role: "rider", $or: riderFilters }).lean()
    : null;

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
    return { notification, pushed: false, reason: "Rider push token missing" };
  }

  const pushResult = await sendPush({
    token,
    title,
    body,
    data: {
      orderId: order.orderId,
      type: "rider_order_assigned",
      screen: "deliveries",
    },
  });
  await clearInvalidPushToken(rider, token, pushResult);

  return {
    notification,
    pushed: pushResult === true || pushResult?.pushed === true,
    reason: pushResult?.reason || "",
  };
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

const notifyOrderStatusChange = async (order = {}, nextStatus = "") => {
  const status = String(nextStatus || order.status || "").trim();
  const orderId = order.orderId || "";
  const results = { vendor: null, rider: null };

  // 1. Vendor Notification & Push
  try {
    const vendorFilters = buildVendorFilters(order);
    let vendor = null;
    if (vendorFilters.length) {
      vendor = await User.findOne({
        role: { $in: ["vendor", "homechefs"] },
        $or: vendorFilters,
      }).lean();
    }

    let vendorTitle = `Order ${status}`;
    let vendorBody = `Order #${orderId} status is now ${status}.`;
    let vendorType = "order_status_update";

    if (status === "Delivered") {
      vendorTitle = "Order Delivered";
      vendorBody = `Order #${orderId} for ${order.customer || 'customer'} has been delivered successfully.`;
      vendorType = "delivery_completed";
    } else if (status === "Out For Delivery") {
      vendorTitle = "Order Out for Delivery";
      vendorBody = `Order #${orderId} has been picked up by ${order.riderName || 'delivery partner'}.`;
      vendorType = "delivery_status_update";
    } else if (status === "Accepted") {
      vendorTitle = "Order Accepted";
      vendorBody = `Order #${orderId} for ${order.meal || 'meal'} accepted.`;
      vendorType = "order_accepted";
    } else if (status === "Preparing") {
      vendorTitle = "Order Preparing";
      vendorBody = `Order #${orderId} is being prepared.`;
    } else if (status === "Ready") {
      vendorTitle = "Order Ready";
      vendorBody = `Order #${orderId} is ready for pickup.`;
    } else if (status === "Cancelled") {
      vendorTitle = "Order Cancelled";
      vendorBody = `Order #${orderId} has been cancelled.`;
    }

    const vendorNotification = await Notification.create({
      title: vendorTitle,
      body: vendorBody,
      audience: "Vendors",
      category: "orderUpdates",
      orderId,
      recipientId: vendor?._id ? String(vendor._id) : String(order.homeChefOwner || order.homeChefId || ""),
      recipientEmail: vendor?.email || (String(order.homeChefOwner || "").includes("@") ? order.homeChefOwner : ""),
      status: "Sent",
      tone: status === "Delivered" ? "success" : status === "Cancelled" ? "danger" : "info",
    });

    const vendorToken = vendor?.pushToken || vendor?.partnerProfile?.pushToken;
    if (vendorToken) {
      await sendPush({
        token: vendorToken,
        title: vendorTitle,
        body: vendorBody,
        data: {
          orderId,
          status,
          title: vendorTitle,
          body: vendorBody,
          type: vendorType,
          screen: "orders",
        },
      });
    }
    results.vendor = vendorNotification;
  } catch (err) {
    console.warn("[partner-notification] Vendor status notify failed", err?.message);
  }

  // 2. Rider Notification & Push
  try {
    const riderFilters = [
      order.riderId ? { _id: order.riderId } : null,
      order.riderEmail ? { email: String(order.riderEmail).toLowerCase().trim() } : null,
      order.riderPhone ? { phone: String(order.riderPhone).trim() } : null,
      order.riderName ? { name: String(order.riderName).trim() } : null,
    ].filter(Boolean);

    const rider = riderFilters.length
      ? await User.findOne({ role: "rider", $or: riderFilters }).lean()
      : null;

    let riderTitle = `Order ${status}`;
    let riderBody = `Order #${orderId} status is now ${status}.`;
    let riderType = "delivery_status_update";

    if (status === "Delivered") {
      riderTitle = "Delivery Completed";
      riderBody = `Order #${orderId} delivered to ${order.customer || 'customer'}. Great job!`;
      riderType = "delivery_completed";
    } else if (status === "Ready") {
      riderTitle = "Order Ready for Pickup";
      riderBody = `Order #${orderId} is ready at ${order.homeChefName || order.chef || 'kitchen'}. Please pickup now.`;
      riderType = "delivery_assigned";
    } else if (status === "Out For Delivery") {
      riderTitle = "Out for Delivery";
      riderBody = `Deliver order #${orderId} to ${order.address || order.customer || 'customer'}.`;
    } else if (status === "Cancelled") {
      riderTitle = "Delivery Cancelled";
      riderBody = `Order #${orderId} has been cancelled.`;
    }

    if (rider || order.riderId || order.riderEmail) {
      const riderNotification = await Notification.create({
        title: riderTitle,
        body: riderBody,
        audience: "Riders",
        category: "orderUpdates",
        orderId,
        recipientId: rider?._id ? String(rider._id) : String(order.riderId || ""),
        recipientEmail: rider?.email || order.riderEmail || "",
        status: "Sent",
        tone: status === "Delivered" ? "success" : status === "Cancelled" ? "danger" : "info",
      });

      const riderToken = rider?.pushToken || rider?.partnerProfile?.pushToken;
      if (riderToken) {
        await sendPush({
          token: riderToken,
          title: riderTitle,
          body: riderBody,
          data: {
            orderId,
            status,
            title: riderTitle,
            body: riderBody,
            type: riderType,
            screen: "deliveries",
          },
        });
      }
      results.rider = riderNotification;
    }
  } catch (err) {
    console.warn("[partner-notification] Rider status notify failed", err?.message);
  }

  return results;
};

module.exports = {
  ensureVendorOrderNotifications,
  getVendorForOrder,
  notifyOrderStatusChange,
  notifyRiderNewAssignment,
  notifyVendorNewOrder,
  sendPush,
};
