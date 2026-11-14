
const express = require("express");
const router = express.Router();

const {
  createReport,
  getReportImage,
  getReports,
  getMyReports,
  getReportById,
  updateReportStatus,
  assignReportTeam,
} = require("../controllers/reportController");

const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.use(protect);

router.get("/images/:imageId", getReportImage);
router.post("/", upload.array("images", 5), createReport);
router.get("/my", getMyReports);
router.get("/", getReports);

router.patch("/:id/assign-team", authorize("Admin"), assignReportTeam);
router.patch("/:id/status", authorize("Admin"), updateReportStatus);

router.get("/:id", getReportById);

module.exports = router;
