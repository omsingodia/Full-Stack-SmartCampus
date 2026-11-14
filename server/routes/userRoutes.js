
const express = require("express");
const router = express.Router();

const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserRole,
  updateUserStatus,
  resetUserPassword,
  bulkImportUsers,
} = require("../controllers/userController");

const { protect, authorize } = require("../middleware/auth");

// All user-management routes are Admin-only
router.use(protect, authorize("Admin"));

router.get("/", getUsers);
router.post("/", createUser);
router.post("/bulk-import", bulkImportUsers);
router.get("/:id", getUserById);
router.patch("/:id", updateUser);
router.patch("/:id/role", updateUserRole);
router.patch("/:id/status", updateUserStatus);
router.patch("/:id/reset-password", resetUserPassword);

module.exports = router;
