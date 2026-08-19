const mongoose = require("mongoose");

const mealSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["today", "next", "tomorrow"],
      required: true,
      unique: true,
    },
    icon: String,
    title: { type: String, required: true },
    status: String,
    meta: String,
    chef: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Meal", mealSchema);
