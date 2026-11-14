const router = require("express").Router();
const { protect, authorize } = require("../middleware/auth");
const { getAdminStats, getTeacherStats, getStudentStats } = require("../controllers/dashboardController");

router.use(protect);
router.get("/admin", authorize("Admin"), getAdminStats);
router.get("/teacher", authorize("Teacher"), getTeacherStats);
router.get("/student", authorize("Student", "Student CR"), getStudentStats);

module.exports = router;
