const express = require("express");

const adminRoutes = require("./admin");
const authRoutes = require("./authRoutes");
const customerRoutes = require("./customerRoutes");
const dataRoutes = require("./dataRoutes");
const deliveryPartnerRoutes = require("./delivery-partner");
const homeRoutes = require("./homeRoutes");
const orderRoutes = require("./orderRoutes");
const superAdminRoutes = require("./super-admin");
const uploadRoutes = require("./uploadRoutes");
const userPortalRoutes = require("./user");
const userRoutes = require("./userRoutes");
const walletRoutes = require("./walletRoutes");
const { UPLOADS_ROUTE } = require("../config/uploads");

const router = express.Router();

router.use("/user", userPortalRoutes);
router.use("/admin", adminRoutes);
router.use("/super-admin", superAdminRoutes);
router.use("/delivery-partner", deliveryPartnerRoutes);

// Legacy aliases kept so the existing mobile and admin clients keep working.
router.use("/auth", authRoutes);
router.use("/customer", customerRoutes);
router.use("/data", dataRoutes);
router.use("/home", homeRoutes);
router.use("/orders", orderRoutes);
router.use(UPLOADS_ROUTE, uploadRoutes);
router.use("/users", userRoutes);
router.use("/wallet", walletRoutes);

module.exports = router;
