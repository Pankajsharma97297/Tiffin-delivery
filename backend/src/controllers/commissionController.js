const CommissionSetting = require("../models/CommissionSetting");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const normalizePercent = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.min(100, Math.max(0, number));
};

const getCommissionSetting = async () => {
  const setting = await CommissionSetting.findOneAndUpdate(
    { key: "default" },
    {
      $setOnInsert: {
        key: "default",
        vendorCommissionPercent: 0,
        riderCommissionPercent: 0,
        isActive: true,
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  ).lean();

  return setting;
};

const getCommissionSettings = asyncHandler(async (_req, res) => {
  const settings = await getCommissionSetting();
  return sendSuccess(res, 200, "Commission settings fetched", { settings });
});

const updateCommissionSettings = asyncHandler(async (req, res) => {
  const settings = await CommissionSetting.findOneAndUpdate(
    { key: "default" },
    {
      $set: {
        vendorCommissionPercent: normalizePercent(req.body?.vendorCommissionPercent),
        riderCommissionPercent: normalizePercent(req.body?.riderCommissionPercent),
        isActive: req.body?.isActive !== false,
        updatedBy: req.account?.email || req.user?.email || req.superAdmin?.email || "",
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  ).lean();

  return sendSuccess(res, 200, "Commission settings updated", { settings });
});

module.exports = {
  getCommissionSetting,
  getCommissionSettings,
  updateCommissionSettings,
};
