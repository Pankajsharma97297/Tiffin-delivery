const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    customer: String,
    customerEmail: String,
    customerPhone: String,
    plan: String,
    planType: String,
    durationDays: Number,
    totalMeals: Number,
    mealsPerDay: Number,
    pricePerMeal: String,
    amount: String,
    homeChefId: String,
    homeChefName: String,
    homeChefOwner: String,
    nextMeal: String,
    skipped: String,
    renewal: String,
    address: String,
    latitude: Number,
    longitude: Number,
    paymentMethod: String,
    paymentProvider: String,
    paymentId: String,
    paymentStatus: String,
    orderId: String,
    startDate: Date,
    endDate: Date,
    status: { type: String, default: "Active" },
  },
  { timestamps: true },
);

subscriptionSchema.index({ customerPhone: 1, status: 1 });
subscriptionSchema.index({ customerEmail: 1, status: 1 });
subscriptionSchema.index({ endDate: 1, status: 1 });
subscriptionSchema.index({ paymentId: 1 });

module.exports = mongoose.model("Subscription", subscriptionSchema);
