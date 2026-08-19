const jwt = require("jsonwebtoken");

const SuperAdmin = require("../models/SuperAdmin");

const protectSuperAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Super admin token is required",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Super admin access required",
      });
    }

    const admin = await SuperAdmin.findById(decoded.id);

    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        message: "Super admin account is inactive or missing",
      });
    }

    req.superAdmin = admin;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired super admin token",
    });
  }
};

const requirePermission = (permission) => (req, res, next) => {
  if (!req.superAdmin?.permissions?.includes(permission)) {
    return res.status(403).json({
      success: false,
      message: `Missing permission: ${permission}`,
    });
  }

  next();
};

module.exports = {
  protectSuperAdmin,
  requirePermission,
};
