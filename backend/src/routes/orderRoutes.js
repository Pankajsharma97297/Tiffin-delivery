const express = require("express");

const {
  createOrder,
  getOrderById,
  getOrders,
  updateOrderStatus,
} = require("../controllers/orderController");
const {
  protect,
  protectAnyAccount,
  requireRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getOrders);
router.post("/", protect, createOrder);
router.get("/:orderId", protect, getOrderById);
router.patch(
  "/:orderId/status",
  protectAnyAccount,
  requireRoles("admin", "super_admin", "rider"),
  updateOrderStatus,
);

module.exports = router;
