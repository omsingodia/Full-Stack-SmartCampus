const jwt = require("jsonwebtoken");
const PlatformUser = require("../models/PlatformUser");

const protectPlatform = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, message: "Platform login required." });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await PlatformUser.findById(decoded.id).select("+password");
    if (!user || !user.isActive || decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({ success: false, message: "Invalid platform session." });
    }
    req.platformUser = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired platform token." });
  }
};
const platformOwnerOnly = (req, res, next) => {
  if (req.platformUser?.role !== "PlatformOwner") {
    return res.status(403).json({ success: false, message: "Platform owner permission required." });
  }
  next();
};
module.exports = { protectPlatform, platformOwnerOnly };
