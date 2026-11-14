const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Campus = require("../models/Campus");
const PlatformUser = require("../models/PlatformUser");
const User = require("../models/User");
const { runWithTenant } = require("../tenancy/context");

const platformLogin = async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ success: false, message: "Email and password are required." });
  const user = await PlatformUser.findOne({ email: String(email).toLowerCase().trim() }).select("+password");
  if (!user || !user.isActive || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ success: false, message: "Invalid platform credentials." });
  }
  const token = jwt.sign({ id: user._id, tokenVersion: user.tokenVersion, scope: "platform" }, process.env.JWT_SECRET, { expiresIn: "8h" });
  res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
};

const listCampuses = async (_req, res) => {
  const campuses = await Campus.find().sort({ createdAt: -1 }).lean();
  res.json({ success: true, campuses });
};

const createCampus = async (req, res) => {
  const { name, institutionName, slug, adminName, adminEmail, adminPassword, primaryDomain } = req.body || {};
  if (![name, institutionName, slug, adminName, adminEmail, adminPassword].every(v => String(v || "").trim())) {
    return res.status(400).json({ success: false, message: "Campus and initial campus administrator details are required." });
  }
  if (String(adminPassword).length < 12) return res.status(400).json({ success: false, message: "Initial administrator password must be at least 12 characters." });
  const normalizedSlug = String(slug).toLowerCase().trim();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedSlug)) return res.status(400).json({ success: false, message: "Campus slug must use lowercase letters, numbers and hyphens." });
  const session = await mongoose.startSession();
  let created;
  try {
    await session.withTransaction(async () => {
      const [campus] = await Campus.create([{
        name, institutionName, slug: normalizedSlug, primaryDomain: primaryDomain || "",
        domains: primaryDomain ? [String(primaryDomain).toLowerCase().trim()] : [],
        status: "active", createdBy: req.platformUser._id
      }], { session });
      created = campus;
      await runWithTenant({ tenantId: campus._id, campus }, async () => {
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  adminUser = new User({
    tenantId: campus._id,
    name: adminName.trim(),
    email: String(adminEmail).toLowerCase().trim(),
    password: hashedPassword,
    role: "Admin",
    isActive: true
  });

  adminUser.$locals.allowTenantBootstrap = true;
  await adminUser.save();
});
    });
    res.status(201).json({ success: true, message: "Campus and its first administrator created.", campus: created });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 400).json({ success: false, message: error.message || "Unable to create campus." });
  } finally {
    await session.endSession();
  }
};

const updateCampusStatus = async (req, res) => {
  const { status } = req.body || {};
  if (!["active", "suspended"].includes(status)) return res.status(400).json({ success: false, message: "Status must be active or suspended." });
  const campus = await Campus.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
  if (!campus) return res.status(404).json({ success: false, message: "Campus not found." });
  res.json({ success: true, campus });
};

const listPublicCampuses = async (_req, res) => {
  try {
    const campuses = await Campus.find({ status: "active" })
      .select("name institutionName slug primaryDomain")
      .sort({ name: 1 })
      .lean();
    res.json({ success: true, campuses });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to load campuses." });
  }
};

const registerNewCampus = async (req, res) => {
  const { name, institutionName, slug, adminName, adminEmail, adminPassword, primaryDomain } = req.body || {};
  if (![name, institutionName, slug, adminName, adminEmail, adminPassword].every(v => String(v || "").trim())) {
    return res.status(400).json({ success: false, message: "Campus name, institution name, campus code, admin name, email, and password are required." });
  }
  if (String(adminPassword).length < 8) {
    return res.status(400).json({ success: false, message: "Administrator password must be at least 8 characters." });
  }
  const normalizedSlug = String(slug).toLowerCase().trim();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedSlug)) {
    return res.status(400).json({ success: false, message: "Campus code must use only lowercase letters, numbers, and hyphens (e.g. 'skit' or 'manipal-jaipur')." });
  }

  const existingSlug = await Campus.findOne({ slug: normalizedSlug });
  if (existingSlug) {
    return res.status(409).json({ success: false, message: "This campus code is already in use. Please pick another one." });
  }

  const session = await mongoose.startSession();
  try {
    let campus;
    let adminUser;
    await session.withTransaction(async () => {
      [campus] = await Campus.create([{
        name: name.trim(),
        institutionName: institutionName.trim(),
        slug: normalizedSlug,
        primaryDomain: primaryDomain ? String(primaryDomain).toLowerCase().trim() : "",
        domains: primaryDomain ? [String(primaryDomain).toLowerCase().trim()] : [],
        status: "active",
        plan: "standard",
        createdBy: null
      }], { session });

      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      [adminUser] = await User.create([{
        name: adminName.trim(),
        email: String(adminEmail).toLowerCase().trim(),
        password: hashedPassword,
        role: "Admin",
        isActive: true,
        tenantId: campus._id
      }], { session });
    });

    const token = jwt.sign(
      { id: adminUser._id, tokenVersion: adminUser.tokenVersion },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(201).json({
      success: true,
      message: `Campus '${campus.name}' registered successfully! You can now log in as administrator.`,
      token,
      campus: {
        id: campus._id,
        name: campus.name,
        institutionName: campus.institutionName,
        slug: campus.slug
      },
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        campusId: campus._id,
        campusName: campus.name,
        campusSlug: campus.slug
      }
    });
  } catch (error) {
    console.error("Campus registration error:", error.message);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Campus code or domain already registered." });
    }
    res.status(500).json({ success: false, message: error.message || "Failed to register campus." });
  } finally {
    await session.endSession();
  }
};

module.exports = { platformLogin, listCampuses, createCampus, updateCampusStatus, listPublicCampuses, registerNewCampus };
