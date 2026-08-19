const express = require("express");

const { updateOrderStatus } = require("../../controllers/orderController");
const {
  getDeliveryOrderDashboard,
  getDeliveryOrderById,
  listDeliveryOrders,
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

router.get("/", listDeliveryOrders);
router.get("/dashboard", getDeliveryOrderDashboard);
router.get("/:orderId", getDeliveryOrderById);
router.patch("/:orderId/status", updateOrderStatus);

module.exports = router;
