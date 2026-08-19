const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      validate: {
        validator(value) {
          return !value || validator.isEmail(value);
        },
        message: "Please provide a valid email",
      },
    },
    phone: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
      trim: true,
    },
    pushToken: {
      type: String,
      trim: true,
    },
    authProvider: {
      type: String,
      enum: ["local", "google", "phone", "apple"],
      default: "local",
    },
    firebaseUid: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
    },
    googleId: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
    },
    appleId: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
    },
    lastLoginAt: {
      type: Date,
    },
    password: {
      type: String,
      required: function passwordRequired() {
        return this.authProvider === "local";
      },
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["customer", "vendor", "rider", "admin"],
      default: "customer",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    partnerProfile: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
