const jwt = require("jsonwebtoken");
const User = require("../models/User");
const SuperAdmin = require("../models/SuperAdmin");
const asyncHandler = require("../utils/asyncHandler");

const buildUserSession = (user) => ({
  id: user._id,
  role: user.role,
  name: user.name,
  email: user.email,
  phone: user.phone,
  authProvider: user.authProvider,
});

const readBearerToken = (req) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.split(" ")[1];
};

const protect = asyncHandler(async (req, res, next) => {
  const token = readBearerToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. Token is required",
    });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);

  if (!user || !user.isActive) {
    return res.status(401).json({
      success: false,
      message: "Invalid token user",
    });
  }

  req.user = buildUserSession(user);

  return next();
});

const optionalProtect = asyncHandler(async (req, res, next) => {
  const token = readBearerToken(req);

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (user?.isActive) {
      req.user = buildUserSession(user);
    }
  } catch {
    // Public routes can still return fallback data when an optional token is stale.
  }

  return next();
});

const protectAnyAccount = asyncHandler(async (req, res, next) => {
  const token = readBearerToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. Token is required",
    });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  if (decoded.role === "super_admin") {
    const superAdmin = await SuperAdmin.findById(decoded.id);

    if (!superAdmin || !superAdmin.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid super admin token user",
      });
    }

    req.superAdmin = superAdmin;
    req.account = {
      id: superAdmin._id,
      role: "super_admin",
      name: superAdmin.name,
      email: superAdmin.email,
      accountType: "super_admin",
    };

    return next();
  }

  const user = await User.findById(decoded.id);

  if (!user || !user.isActive) {
    return res.status(401).json({
      success: false,
      message: "Invalid token user",
    });
  }

  req.user = buildUserSession(user);
  req.account = {
    ...req.user,
    accountType: "user",
  };

  return next();
});

const requireRoles = (...roles) => (req, res, next) => {
  const allowedRoles = roles.flat();
  const role = req.account?.role || req.user?.role || req.superAdmin?.role;

  if (!allowedRoles.includes(role)) {
    return res.status(403).json({
      success: false,
      message: "You do not have access to this route",
      roles: allowedRoles,
    });
  }

  return next();
};

module.exports = {
  optionalProtect,
  protect,
  protectAnyAccount,
  requireRoles,
};
