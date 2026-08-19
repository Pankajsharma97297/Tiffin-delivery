const Customer = require("../models/Customer");

const buildCustomerSubscriptionFilter = (subscription = {}) => {
  const filters = [
    subscription.customerEmail
      ? { email: String(subscription.customerEmail).toLowerCase().trim() }
      : null,
    subscription.customerPhone
      ? { phone: String(subscription.customerPhone).trim() }
      : null,
    subscription.customer ? { name: String(subscription.customer).trim() } : null,
  ].filter(Boolean);

  if (!filters.length) {
    return null;
  }

  return filters.length === 1 ? filters[0] : { $or: filters };
};

const toActiveSubscriptionSummary = (subscription = {}) => ({
  subscriptionId: String(subscription._id || subscription.subscriptionId || ""),
  orderId: subscription.orderId,
  plan: subscription.plan,
  planType: subscription.planType,
  status: subscription.status,
  startDate: subscription.startDate,
  endDate: subscription.endDate,
  renewal: subscription.renewal,
  durationDays: subscription.durationDays,
  totalMeals: subscription.totalMeals,
  mealsPerDay: subscription.mealsPerDay,
  amount: subscription.amount,
  homeChefId: subscription.homeChefId,
  homeChefName: subscription.homeChefName,
  homeChefOwner: subscription.homeChefOwner,
  address: subscription.address,
  paymentMethod: subscription.paymentMethod,
  paymentProvider: subscription.paymentProvider,
  paymentStatus: subscription.paymentStatus,
});

const toCustomerInsertDefaults = (subscription = {}) => ({
  name:
    subscription.customer ||
    subscription.customerEmail ||
    subscription.customerPhone ||
    "MIDDO Customer",
  ...(subscription.customerEmail
    ? { email: String(subscription.customerEmail).toLowerCase().trim() }
    : {}),
  ...(subscription.customerPhone
    ? { phone: String(subscription.customerPhone).trim() }
    : {}),
  isActive: true,
});

const syncCustomerActiveSubscription = async (subscription) => {
  const filter = buildCustomerSubscriptionFilter(subscription);

  if (!filter) {
    return null;
  }

  return Customer.findOneAndUpdate(
    filter,
    {
      $set: {
        activeSubscription: toActiveSubscriptionSummary(subscription),
      },
      $setOnInsert: toCustomerInsertDefaults(subscription),
    },
    {
      returnDocument: "after",
      runValidators: true,
      upsert: true,
    },
  );
};

module.exports = {
  syncCustomerActiveSubscription,
};
