const express = require("express");

const { getProfile, updateProfile } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const { loginUser, registerUser } = require("../controllers/authController");

const router = express.Router();

// Backward-compatible routes for clients already using /api/users.
router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

module.exports = router;
