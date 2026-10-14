const mongoose = require("mongoose");

const commissionSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "default",
      unique: true,
      trim: true,
    },
    vendorCommissionPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    riderCommissionPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    updatedBy: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model("CommissionSetting", commissionSettingSchema);
