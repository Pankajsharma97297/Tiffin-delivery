const express = require("express");

const { updateOrderStatus } = require("../../controllers/orderController");
const {
  getDeliveryOrderDashboard,
  getDeliveryOrderById,
  listDeliveryOrders,
} = require("../../controllers/deliveryPartnerController");
const {
  protect,
  requireRoles,
} = require("../../middleware/authMiddleware");

const router = express.Router();

router.use(protect, requireRoles("rider", "vendor"));

router.get("/", listDeliveryOrders);
router.get("/dashboard", getDeliveryOrderDashboard);
router.get("/:orderId", getDeliveryOrderById);
router.patch("/:orderId/status", updateOrderStatus);

module.exports = router;
