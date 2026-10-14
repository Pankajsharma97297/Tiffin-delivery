const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const validator = require("validator");

const manageableTables = [
  "admins",
  "categories",
  "customers",
  "homeChefChangeRequests",
  "homeChefChangeSettings",
  "homeChefs",
  "meals",
  "notifications",
  "orders",
  "plans",
  "products",
  "reviews",
  "scheduleItems",
  "subscriptions",
  "subscriptionRequests",
  "supportTickets",
  "walletTransactions",
];

const actions = ["create", "read", "update", "delete"];
const superAdminPermissions = manageableTables.flatMap((table) =>
  actions.map((action) => `${table}:${action}`),
);

const superAdminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      default: "super_admin",
    },
    permissions: {
      type: [String],
      default: superAdminPermissions,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

superAdminSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});

superAdminSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("SuperAdmin", superAdminSchema);
module.exports.superAdminPermissions = superAdminPermissions;
