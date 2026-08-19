const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    avatar: String,
    phone: String,
    email: { type: String, lowercase: true, trim: true },
    pushToken: { type: String, trim: true },
    authProvider: {
      type: String,
      enum: ["local", "google", "phone", "apple"],
      default: "local",
    },
    firebaseUid: { type: String, trim: true, sparse: true, unique: true },
    googleId: { type: String, trim: true, sparse: true, unique: true },
    appleId: { type: String, trim: true, sparse: true, unique: true },
    location: String,
    address: String,
    liveAddress: String,
    latitude: Number,
    longitude: Number,
    settings: {
      notifications: {
        orderUpdates: { type: Boolean, default: true },
        promotions: { type: Boolean, default: true },
        mealReminders: { type: Boolean, default: false },
      },
      appearance: {
        darkMode: { type: Boolean, default: false },
      },
      language: { type: String, default: "English (India)" },
    },
    savedAddresses: [
      {
        label: { type: String, default: "Home" },
        address: String,
        liveAddress: String,
        latitude: Number,
        longitude: Number,
        isDefault: { type: Boolean, default: false },
      },
    ],
    walletBalance: { type: Number, default: 0 },
    activeSubscription: {
      subscriptionId: String,
      orderId: String,
      plan: String,
      planType: String,
      status: String,
      startDate: Date,
      endDate: Date,
      renewal: String,
      durationDays: Number,
      totalMeals: Number,
      mealsPerDay: Number,
      amount: String,
      homeChefId: String,
      homeChefName: String,
      homeChefOwner: String,
      address: String,
      paymentMethod: String,
      paymentProvider: String,
      paymentStatus: String,
    },
    rating: String,
    orders: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

customerSchema.index({ phone: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ isActive: 1 });

module.exports = mongoose.model("Customer", customerSchema);
