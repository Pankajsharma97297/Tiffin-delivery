const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    customer: String,
    chef: String,
    rating: String,
    text: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Review", reviewSchema);
