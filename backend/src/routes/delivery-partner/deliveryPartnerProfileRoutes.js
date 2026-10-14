const express = require("express");

const {
  clearPartnerNotifications,
  getHomeChefMenu,
  getHomeChefPhotos,
  getPartnerProfile,
  listPartnerNotifications,
  registerPartnerPushToken,
  updateHomeChefMenu,
  updateHomeChefPhotos,
  updatePartnerAvailability,
  updatePartnerKyc,
  updatePartnerProfile,
  updatePartnerRole,
} = require("../../controllers/deliveryPartnerController");
const {
  protect,
  requireRoles,
} = require("../../middleware/authMiddleware");

const router = express.Router();

router.use(protect, requireRoles("rider", "vendor"));

router.get("/", getPartnerProfile);
router.patch("/", updatePartnerProfile);
router.patch("/role", updatePartnerRole);
router.patch("/availability", updatePartnerAvailability);
router.patch("/kyc", updatePartnerKyc);
router.get("/notifications", listPartnerNotifications);
router.delete("/notifications", clearPartnerNotifications);
router.post("/notifications/register-device", registerPartnerPushToken);
router.get("/menu", getHomeChefMenu);
router.patch("/menu", updateHomeChefMenu);
router.get("/photos", getHomeChefPhotos);
router.patch("/photos", updateHomeChefPhotos);

module.exports = router;
