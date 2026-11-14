const Campus = require("../models/Campus");
const { runWithTenant } = require("./context");

const resolveTenant = async (req, res, next) => {
  try {
    const host = String(req.headers.host || "").split(":")[0].toLowerCase();
    const configuredRoot = String(process.env.ROOT_DOMAIN || "campuscare.in").toLowerCase();
    const subdomain = host.endsWith(`.${configuredRoot}`)
      ? host.slice(0, -(configuredRoot.length + 1)).split(".")[0]
      : "";
    const slug = String(req.headers["x-campus-slug"] || req.body?.campusSlug || req.body?.campus || req.query?.campusSlug || req.query?.campus || subdomain || process.env.DEFAULT_CAMPUS_SLUG || "").toLowerCase().trim();
    if (!slug) {
      return res.status(400).json({
        success: false,
        code: "CAMPUS_REQUIRED",
        message: "Select your campus or open its campus-specific URL."
      });
    }
    const campus = await Campus.findOne({
      status: "active",
      ...(slug ? { slug } : { domains: host })
    }).lean();
    if (!campus) {
      return res.status(404).json({ success: false, code: "CAMPUS_NOT_FOUND", message: "Campus not found or not active." });
    }
    req.campus = campus;
    runWithTenant({ tenantId: campus._id, campus }, next);
  } catch (error) {
    next(error);
  }
};

module.exports = resolveTenant;
