const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    image: String,
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: String,
    mealType: String,
    tags: [String],
    price: { type: String, required: true },
    status: { type: String, default: "Active" },
    createdBy: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", productSchema);
