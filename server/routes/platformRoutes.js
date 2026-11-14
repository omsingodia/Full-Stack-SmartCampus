const router = require("express").Router();
const { platformLogin, listCampuses, createCampus, updateCampusStatus, listPublicCampuses, registerNewCampus } = require("../controllers/platformController");
const { protectPlatform, platformOwnerOnly } = require("../middleware/platformAuth");

// Public endpoints (no platform token needed)
router.post("/auth/login", platformLogin);
router.get("/campuses/public", listPublicCampuses);
router.post("/campuses/register", registerNewCampus);

// Protected Platform Owner endpoints
router.use(protectPlatform, platformOwnerOnly);
router.get("/campuses", listCampuses);
router.post("/campuses", createCampus);
router.patch("/campuses/:id/status", updateCampusStatus);

module.exports = router;
