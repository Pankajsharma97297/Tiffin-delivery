const roundMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

const parseMoney = (value) => {
  const amount = Number(String(value || "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
};

const normalizePercent = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.min(100, Math.max(0, number));
};

const getActiveCommissionRates = (setting) => {
  const isActive = setting?.isActive !== false;

  return {
    isActive,
    vendorCommissionPercent: isActive
      ? normalizePercent(setting?.vendorCommissionPercent)
      : 0,
    riderCommissionPercent: isActive
      ? normalizePercent(setting?.riderCommissionPercent)
      : 0,
  };
};

const partnerShare = (amount, percent) =>
  roundMoney(parseMoney(amount) * (normalizePercent(percent) / 100));

const isDeliveredOrder = (order = {}) =>
  ["Delivered", "Completed"].includes(String(order.status || ""));

const summarizePartnerEarnings = (orders = [], percent = 0) => {
  const history = [];
  let totalEarned = 0;
  let pendingPayout = 0;

  orders.forEach((order) => {
    const gross = parseMoney(order.amount);
    const payout = partnerShare(gross, percent);
    const delivered = isDeliveredOrder(order);

    if (delivered) {
      totalEarned = roundMoney(totalEarned + payout);
      pendingPayout = roundMoney(pendingPayout + payout);
      history.push({
        orderId: order.orderId,
        customer: order.customer || "",
        meal: order.meal || "",
        status: order.status,
        gross,
        payout,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      });
      return;
    }

    pendingPayout = roundMoney(pendingPayout + payout);
  });

  history.sort((left, right) => {
    const leftTime = new Date(right.updatedAt || right.createdAt || 0).getTime();
    const rightTime = new Date(left.updatedAt || left.createdAt || 0).getTime();
    return leftTime - rightTime;
  });

  return {
    totalEarned,
    pendingPayout,
    settled: 0,
    history,
  };
};

module.exports = {
  getActiveCommissionRates,
  parseMoney,
  partnerShare,
  roundMoney,
  summarizePartnerEarnings,
};
