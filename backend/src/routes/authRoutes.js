const express = require("express");

const {
  deactivateCustomerAccount,
  deleteCustomerAccount,
  appleLoginUser,
  firebaseLoginUser,
  googleLoginUser,
  loginUser,
  registerUser,
  startPhoneOtp,
  updateCustomerAddresses,
  updateCustomerLocation,
  updateCustomerProfile,
  updateCustomerSettings,
  verifyPhoneOtp,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/otp/start", startPhoneOtp);
router.post("/otp/verify", verifyPhoneOtp);
router.post("/firebase", firebaseLoginUser);
router.post("/google", googleLoginUser);
router.post("/apple", appleLoginUser);
router.post("/location", updateCustomerLocation);
router.patch("/profile", protect, updateCustomerProfile);
router.patch("/settings", updateCustomerSettings);
router.patch("/addresses", updateCustomerAddresses);
router.post("/deactivate", deactivateCustomerAccount);
router.delete("/account", deleteCustomerAccount);

module.exports = router;
