const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    customer: { type: String, required: true, trim: true },
    customerEmail: String,
    customerPhone: String,
    meal: { type: String, required: true, trim: true },
    chef: String,
    status: {
      type: String,
      enum: [
        "Order Confirmed",
        "Accepted",
        "Preparing",
        "Ready",
        "Out For Delivery",
        "Delivered",
      ],
      default: "Order Confirmed",
    },
    amount: { type: String, required: true },
    eta: { type: String, default: "30 min" },
    orderType: {
      type: String,
      enum: ["single", "subscription", "group"],
      default: "single",
    },
    address: String,
    latitude: Number,
    longitude: Number,
    planType: String,
    durationDays: Number,
    mealsPerDay: Number,
    totalMeals: Number,
    perMealPrice: String,
    homeChefId: String,
    homeChefName: String,
    homeChefOwner: String,
    riderId: String,
    riderName: String,
    riderPhone: String,
    riderEmail: String,
    deliveryBatchId: String,
    deliverySequence: { type: Number, default: 0 },
    paymentMethod: {
      type: String,
      enum: ["UPI", "Credit Card", "Debit Card", "Net Banking", "Wallet"],
      required: true,
    },
    paymentProvider: {
      type: String,
      enum: ["Razorpay", "Cashfree", "Wallet"],
      default: "Razorpay",
    },
    paymentId: String,
    paymentStatus: { type: String, default: "Paid" },
    source: { type: String, default: "middo-app" },
    items: [String],
    notes: String,
  },
  { timestamps: true },
);

orderSchema.index({ customerPhone: 1, createdAt: -1 });
orderSchema.index({ customerEmail: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ paymentId: 1 });
orderSchema.index({ riderId: 1, status: 1, deliverySequence: 1 });
orderSchema.index({ riderEmail: 1, status: 1, deliverySequence: 1 });
orderSchema.index({ riderPhone: 1, status: 1, deliverySequence: 1 });

module.exports = mongoose.model("Order", orderSchema);
