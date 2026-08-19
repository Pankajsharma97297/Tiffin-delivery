const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    body: String,
    category: {
      type: String,
      enum: ["orderUpdates", "promotions", "mealReminders"],
      default: "orderUpdates",
    },
    icon: String,
    tone: String,
    title: { type: String, required: true },
    audience: String,
    recipientId: String,
    recipientEmail: String,
    orderId: String,
    status: { type: String, default: "Draft" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Notification", notificationSchema);
