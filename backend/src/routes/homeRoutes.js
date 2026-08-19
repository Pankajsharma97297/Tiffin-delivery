const express = require("express");

const {
  assignScheduleMeal,
  getAdminDashboard,
  getHomeData,
  submitHomeChefChangeRequest,
  submitSubscriptionRequest,
} = require("../controllers/homeController");
const {
  protectSuperAdmin,
  requirePermission,
} = require("../middleware/superAdminMiddleware");
const { optionalProtect, protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", optionalProtect, getHomeData);
router.post("/home-chef-change-requests", protect, submitHomeChefChangeRequest);
router.post("/subscription-requests", protect, submitSubscriptionRequest);
router.get("/admin-dashboard", getAdminDashboard);
router.put(
  "/schedule/:day",
  protectSuperAdmin,
  requirePermission("scheduleItems:update"),
  assignScheduleMeal,
);

module.exports = router;
