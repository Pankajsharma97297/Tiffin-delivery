const mongoose = require("mongoose");

const subscriptionRequestSchema = new mongoose.Schema(
  {
    customer: String,
    customerEmail: String,
    customerPhone: String,
    subscriptionId: String,
    requestType: {
      type: String,
      enum: ["skip_meal", "location_change"],
      required: true,
    },
    mealDate: Date,
    mealTitle: String,
    reason: String,
    currentAddress: String,
    newAddress: String,
    newLatitude: Number,
    newLongitude: Number,
    status: { type: String, default: "Pending Admin Approval" },
    note: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model(
  "SubscriptionRequest",
  subscriptionRequestSchema,
);
