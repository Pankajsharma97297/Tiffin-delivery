const mongoose = require("mongoose");

const weeklyMenuItemSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      required: true,
      uppercase: true,
      enum: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
    },
    icon: { type: String, default: "🍱" },
    title: { type: String, required: true, trim: true },
    items: { type: String, default: "" },
    mealType: { type: String, default: "Lunch" },
    price: String,
    isAvailable: { type: Boolean, default: true },
  },
  { _id: false },
);

const sampleMenuItemSchema = new mongoose.Schema(
  {
    icon: { type: String, default: "🍱" },
    title: { type: String, required: true, trim: true },
    items: { type: String, default: "" },
    price: String,
    isAvailable: { type: Boolean, default: true },
  },
  { _id: false },
);

const homeChefSchema = new mongoose.Schema(
  {
    image: String,
    name: { type: String, required: true, trim: true },
    owner: String,
    badge: String,
    cuisine: String,
    tags: [String],
    rating: String,
    reviewCount: { type: Number, default: 142 },
    distance: String,
    location: String,
    address: String,
    liveAddress: String,
    latitude: Number,
    longitude: Number,
    time: String,
    experience: String,
    subscribers: String,
    price: String,
    about: String,
    fssaiStatus: { type: String, default: "Certified" },
    foodType: { type: String, default: "100% Veg" },
    achievement: { type: String, default: "Top HomeChef" },
    hygieneRating: { type: String, default: "A+" },
    orders: { type: Number, default: 0 },
    status: { type: String, default: "Active" },
    isAssigned: { type: Boolean, default: false },
    weeklyMenu: [weeklyMenuItemSchema],
    sampleMenu: [sampleMenuItemSchema],
  },
  { timestamps: true },
);

module.exports = mongoose.model("HomeChef", homeChefSchema);
