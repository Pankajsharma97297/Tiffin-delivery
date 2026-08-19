const express = require("express");

const {
  getWalletTransactions,
  topUpWallet,
} = require("../controllers/walletController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/transactions", getWalletTransactions);
router.post("/top-up", topUpWallet);

module.exports = router;
