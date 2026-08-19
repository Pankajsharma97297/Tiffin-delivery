const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    meals: String,
    price: String,
    users: { type: Number, default: 0 },
    status: { type: String, default: "Visible" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Plan", planSchema);
