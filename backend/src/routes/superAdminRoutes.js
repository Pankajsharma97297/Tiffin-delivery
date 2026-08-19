const express = require("express");

const {
  createCategory,
  createAdmin,
  createManagedTableRow,
  createProduct,
  deleteAdmin,
  deleteProduct,
  deleteManagedTableRow,
  expireSubscription,
  getAdmins,
  getManageableTables,
  getManagedTableData,
  getProducts,
  getSuperAdminProfile,
  loginSuperAdmin,
  updateSuperAdminPermissions,
  updateAdmin,
  updateManagedTableRow,
  updateProduct,
} = require("../controllers/superAdminController");
const {
  protectSuperAdmin,
  requirePermission,
} = require("../middleware/superAdminMiddleware");

const router = express.Router();

router.post("/login", loginSuperAdmin);
router.get("/me", protectSuperAdmin, getSuperAdminProfile);
router.put("/permissions", protectSuperAdmin, updateSuperAdminPermissions);
router.get(
  "/admins",
  protectSuperAdmin,
  requirePermission("admins:read"),
  getAdmins,
);
router.post(
  "/admins",
  protectSuperAdmin,
  requirePermission("admins:create"),
  createAdmin,
);
router.put(
  "/admins/:id",
  protectSuperAdmin,
  requirePermission("admins:update"),
  updateAdmin,
);
router.delete(
  "/admins/:id",
  protectSuperAdmin,
  requirePermission("admins:delete"),
  deleteAdmin,
);
router.get("/tables", protectSuperAdmin, getManageableTables);
router.patch(
  "/subscriptions/:id/expire",
  protectSuperAdmin,
  requirePermission("subscriptions:update"),
  expireSubscription,
);
router.get(
  "/tables/:table",
  protectSuperAdmin,
  (req, res, next) =>
    requirePermission(`${req.params.table}:read`)(req, res, next),
  getManagedTableData,
);
router.post(
  "/tables/:table",
  protectSuperAdmin,
  (req, res, next) =>
    requirePermission(`${req.params.table}:create`)(req, res, next),
  createManagedTableRow,
);
router.put(
  "/tables/:table/:id",
  protectSuperAdmin,
  (req, res, next) =>
    requirePermission(`${req.params.table}:update`)(req, res, next),
  updateManagedTableRow,
);
router.delete(
  "/tables/:table/:id",
  protectSuperAdmin,
  (req, res, next) =>
    requirePermission(`${req.params.table}:delete`)(req, res, next),
  deleteManagedTableRow,
);
router.get(
  "/products",
  protectSuperAdmin,
  requirePermission("products:read"),
  getProducts,
);
router.post(
  "/products",
  protectSuperAdmin,
  requirePermission("products:create"),
  createProduct,
);
router.put(
  "/products/:id",
  protectSuperAdmin,
  requirePermission("products:update"),
  updateProduct,
);
router.delete(
  "/products/:id",
  protectSuperAdmin,
  requirePermission("products:delete"),
  deleteProduct,
);
router.post(
  "/categories",
  protectSuperAdmin,
  requirePermission("categories:create"),
  createCategory,
);

module.exports = router;
