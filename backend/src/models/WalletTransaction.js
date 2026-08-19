const mongoose = require("mongoose");

const walletTransactionSchema = new mongoose.Schema(
  {
    customer: String,
    type: String,
    amount: String,
    note: String,
  },
  { timestamps: true },
);

walletTransactionSchema.index({ customer: 1, createdAt: -1 });
walletTransactionSchema.index({ type: 1 });

module.exports = mongoose.model("WalletTransaction", walletTransactionSchema);
