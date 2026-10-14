const express = require("express");

const {
  getCommissionSettings,
  updateCommissionSettings,
} = require("../../controllers/commissionController");
const {
  protectAnyAccount,
  requireRoles,
} = require("../../middleware/authMiddleware");

const router = express.Router();

router.use(protectAnyAccount, requireRoles("admin", "super_admin"));

router.get("/", getCommissionSettings);
router.put("/", updateCommissionSettings);

module.exports = router;
