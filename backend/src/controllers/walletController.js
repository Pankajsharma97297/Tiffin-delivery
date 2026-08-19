const Customer = require("../models/Customer");
const WalletTransaction = require("../models/WalletTransaction");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const toAmountNumber = (value) => {
  const amount = Number(String(value || "").replace(/[^\d.]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
};

const customerFilterFromUser = (user = {}, fallback = {}) => {
  if (user.email) {
    return { email: String(user.email).toLowerCase().trim() };
  }
  if (user.phone) {
    return { phone: String(user.phone).trim() };
  }
  return { name: user.name || fallback.customer || fallback.phone || fallback.email };
};

const topUpWallet = asyncHandler(async (req, res) => {
  const {
    amount,
    customer,
    email,
    note,
    paymentId,
    paymentMethod = "UPI",
    phone,
  } = req.body;
  const numericAmount = toAmountNumber(amount);

  if (!numericAmount || numericAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Valid top-up amount is required",
    });
  }

  const customerFilter = customerFilterFromUser(req.user, req.body);

  if (!customerFilter) {
    return res.status(400).json({
      success: false,
      message: "Customer email, phone or name is required",
    });
  }

  const updatedCustomer = await Customer.findOneAndUpdate(
    customerFilter,
    {
      $inc: { walletBalance: numericAmount },
      $setOnInsert: {
        name: req.user?.name || customer || phone || email,
        email: req.user?.email || (email ? String(email).toLowerCase().trim() : undefined),
        phone: req.user?.phone || phone,
        isActive: true,
      },
    },
    {
      returnDocument: "after",
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );

  const transaction = await WalletTransaction.create({
    customer: updatedCustomer.name,
    type: "Top-up",
    amount: `+₹${numericAmount}`,
    note:
      note ||
      `${paymentMethod} wallet add${paymentId ? ` · ${paymentId}` : ""}`,
  });

  return sendSuccess(res, 200, "Wallet topped up", {
    customer: updatedCustomer,
    transaction,
  });
});

const getWalletTransactions = asyncHandler(async (req, res) => {
  const { customer, email, phone } = req.query;
  const customerDoc = await Customer.findOne(
    customerFilterFromUser(req.user, { customer, email, phone }),
  ).lean();
  const customerName = customerDoc?.name || customer;
  const filter = customerName ? { customer: customerName } : {};
  const transactions = await WalletTransaction.find(filter)
    .sort({ createdAt: -1 })
    .limit(25)
    .lean();

  return sendSuccess(res, 200, "Wallet transactions fetched", { transactions });
});

module.exports = {
  getWalletTransactions,
  topUpWallet,
};
