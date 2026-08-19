const express = require("express");

const authRoutes = require("../authRoutes");
const customerRoutes = require("../customerRoutes");
const homeRoutes = require("../homeRoutes");
const orderRoutes = require("../orderRoutes");
const uploadRoutes = require("../uploadRoutes");
const userRoutes = require("../userRoutes");
const walletRoutes = require("../walletRoutes");
const { UPLOADS_ROUTE } = require("../../config/uploads");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/customer", customerRoutes);
router.use("/home", homeRoutes);
router.use("/orders", orderRoutes);
router.use(UPLOADS_ROUTE, uploadRoutes);
router.use("/wallet", walletRoutes);
router.use("/", userRoutes);

module.exports = router;
