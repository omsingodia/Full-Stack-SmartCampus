
const express = require("express");
const router = express.Router();


const {
  createItem,
  getItems,
  getItemById,
  getImage,
  submitClaim,
  getClaims,
  reviewClaim,
  updateItemStatus,
  deleteItem,
} = require("../controllers/lostFoundController");



const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");

// All Lost & Found routes require login
router.use(protect);

// Image retrieval - keep before /:id
router.get("/images/:imageId", getImage);

// Item routes
router.post("/", upload.array("images", 5), createItem);
router.get("/", getItems);

// Claim routes - keep these before /:id
router.get("/claims", getClaims);
router.post("/:id/claims", submitClaim);

// Teacher/Admin verification
router.patch(
  "/claims/:claimId/review",
  authorize("Teacher", "Admin"),
  reviewClaim
);
router.patch("/:id/status", authorize("Teacher", "Admin"), updateItemStatus);
// Admin-only item deletion
router.delete(
  "/:id",
  authorize("Admin"),
  deleteItem
);
// Single item details
router.get("/:id", getItemById);

module.exports = router;
