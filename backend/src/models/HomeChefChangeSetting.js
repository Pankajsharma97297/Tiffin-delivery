const mongoose = require("mongoose");

const homeChefChangeSettingSchema = new mongoose.Schema(
  {
    key: { type: String, default: "default", unique: true },
    title: { type: String, default: "Change HomeChef" },
    subtitle: { type: String, default: "Request a different HomeChef" },
    description: {
      type: String,
      default:
        "Not satisfied? You can request a HomeChef change. Subject to availability and admin approval.",
    },
    sheetDescription: {
      type: String,
      default:
        "Please let us know why you'd like to change your HomeChef. This helps us improve our service.",
    },
    successMessage: {
      type: String,
      default:
        "Your HomeChef change request is under review. Our team will assign a new HomeChef within 24 hours.",
    },
    expectedResolution: { type: String, default: "within 24 hours" },
    reasons: {
      type: [String],
      default: [
        "Food quality not satisfactory",
        "Portion sizes too small",
        "Delivery frequently late",
        "Menu variety too limited",
        "Hygiene concerns",
        "Other reason",
      ],
    },
    isEnabled: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model(
  "HomeChefChangeSetting",
  homeChefChangeSettingSchema,
);
