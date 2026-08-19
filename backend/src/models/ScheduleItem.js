const mongoose = require("mongoose");

const scheduleItemSchema = new mongoose.Schema(
  {
    day: { type: String, required: true, unique: true },
    icon: String,
    meal: String,
    title: String,
    mealType: { type: String, default: "Lunch" },
    meta: String,
    chef: String,
    status: String,
    active: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ScheduleItem", scheduleItemSchema);
