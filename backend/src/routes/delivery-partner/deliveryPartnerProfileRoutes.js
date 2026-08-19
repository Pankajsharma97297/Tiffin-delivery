const express = require("express");

const {
  getHomeChefMenu,
  getHomeChefPhotos,
  getPartnerProfile,
  listPartnerNotifications,
  registerPartnerPushToken,
  sendPartnerTestPush,
  updateHomeChefMenu,
  updateHomeChefPhotos,
  updatePartnerAvailability,
  updatePartnerProfile,
  updatePartnerRole,
} = require("../../controllers/deliveryPartnerController");
const {
  optionalProtect,
  requireRoles,
} = require("../../middleware/authMiddleware");

const router = express.Router();

const allowBypassOrPartner = (req, res, next) => {
  if (!req.user) {
    return next();
  }

  return requireRoles("rider", "vendor")(req, res, next);
};

router.use(optionalProtect, allowBypassOrPartner);

router.get("/", getPartnerProfile);
router.patch("/", updatePartnerProfile);
router.patch("/role", updatePartnerRole);
router.patch("/availability", updatePartnerAvailability);
router.get("/notifications", listPartnerNotifications);
router.post("/notifications/register-device", registerPartnerPushToken);
router.post("/notifications/test-push", sendPartnerTestPush);
router.get("/menu", getHomeChefMenu);
router.patch("/menu", updateHomeChefMenu);
router.get("/photos", getHomeChefPhotos);
router.patch("/photos", updateHomeChefPhotos);

module.exports = router;
