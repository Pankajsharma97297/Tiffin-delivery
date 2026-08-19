const express = require("express");

const deliveryPartnerAuthRoutes = require("./deliveryPartnerAuthRoutes");
const deliveryPartnerOrderRoutes = require("./deliveryPartnerOrderRoutes");
const deliveryPartnerProfileRoutes = require("./deliveryPartnerProfileRoutes");

const router = express.Router();

router.use("/auth", deliveryPartnerAuthRoutes);
router.use("/orders", deliveryPartnerOrderRoutes);
router.use("/profile", deliveryPartnerProfileRoutes);

module.exports = router;
