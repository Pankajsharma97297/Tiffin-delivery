const express = require("express");

const adminAuthRoutes = require("./adminAuthRoutes");
const adminCommissionRoutes = require("./adminCommissionRoutes");
const adminDashboardRoutes = require("./adminDashboardRoutes");
const adminOrderRoutes = require("./adminOrderRoutes");
const adminPartnerRoutes = require("./adminPartnerRoutes");

const router = express.Router();

router.use("/auth", adminAuthRoutes);
router.use("/commission", adminCommissionRoutes);
router.use("/dashboard", adminDashboardRoutes);
router.use("/orders", adminOrderRoutes);
router.use("/partners", adminPartnerRoutes);

module.exports = router;
