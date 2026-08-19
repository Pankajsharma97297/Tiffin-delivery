const express = require("express");

const {
  assignRiderToOrder,
  assignVendorToOrder,
  updateOrderStatus,
} = require("../../controllers/orderController");
const {
  protectAnyAccount,
  requireRoles,
} = require("../../middleware/authMiddleware");

const router = express.Router();

router.patch(
  "/:orderId/assign-vendor",
  protectAnyAccount,
  requireRoles("admin", "super_admin"),
  assignVendorToOrder,
);

router.patch(
  "/:orderId/assign-rider",
  protectAnyAccount,
  requireRoles("admin", "super_admin"),
  assignRiderToOrder,
);

router.patch(
  "/:orderId/status",
  protectAnyAccount,
  requireRoles("admin", "super_admin"),
  updateOrderStatus,
);

module.exports = router;
