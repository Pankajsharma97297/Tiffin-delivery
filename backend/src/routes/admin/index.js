const express = require("express");

const adminAuthRoutes = require("./adminAuthRoutes");
const adminDashboardRoutes = require("./adminDashboardRoutes");
const adminOrderRoutes = require("./adminOrderRoutes");

const router = express.Router();

router.use("/auth", adminAuthRoutes);
router.use("/dashboard", adminDashboardRoutes);
router.use("/orders", adminOrderRoutes);

module.exports = router;
