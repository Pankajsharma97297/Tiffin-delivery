const express = require("express");

const { getAdminDashboard } = require("../../controllers/homeController");
const {
  protectAnyAccount,
  requireRoles,
} = require("../../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/",
  protectAnyAccount,
  requireRoles("admin", "super_admin"),
  getAdminDashboard,
);

module.exports = router;
