const express = require("express");

const { reviewPartnerKyc } = require("../../controllers/deliveryPartnerController");
const {
  updateManagedTableRow,
  deleteManagedTableRow,
} = require("../../controllers/superAdminController");
const {
  protectAnyAccount,
  requireRoles,
} = require("../../middleware/authMiddleware");

const router = express.Router();

router.put(
  "/manage/:table/:id",
  protectAnyAccount,
  requireRoles("admin", "super_admin"),
  updateManagedTableRow,
);

router.delete(
  "/manage/:table/:id",
  protectAnyAccount,
  requireRoles("admin", "super_admin"),
  deleteManagedTableRow,
);

router.patch(
  "/:userId/kyc",
  protectAnyAccount,
  requireRoles("admin", "super_admin"),
  reviewPartnerKyc,
);

module.exports = router;
