
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const ALLOWED_ROLES = ["Student", "Student CR", "Teacher"];
const ALL_ROLES = [...ALLOWED_ROLES, "Admin"];

// Get users with search and pagination
const getUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const search = (req.query.search || "").trim();
    const role = req.query.role;

    const filter = {};

    if (role) {
      if (!ALL_ROLES.includes(role)) {
        return res.status(400).json({ success: false, message: "Invalid role filter" });
      }
      filter.role = role;
    }

    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(safeSearch, "i");
      filter.$or = [{ name: regex }, { email: regex }, { role: regex }];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      users,
    });
  } catch (error) {
    console.error("Get users error:", error.message);
    res.status(500).json({ success: false, message: "Unable to fetch users" });
  }
};

// Create a new Teacher, Student CR or Student
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, year, className, section, rollNumber } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password and role are required",
      });
    }

    if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 80) {
      return res.status(400).json({ success: false, message: "Name must be 2–80 characters" });
    }

    if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      return res.status(400).json({ success: false, message: "Enter a valid email address" });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must contain at least 8 characters" });
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Only Student, Student CR and Teacher accounts can be created here",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "An account with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
      year: Number(year || 1),
      className: className || "",
      section: section || "",
      rollNumber: rollNumber || "",
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        className: user.className,
        section: user.section,
        rollNumber: user.rollNumber,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Email already exists" });
    }
    console.error("Create user error:", error.message);
    res.status(500).json({ success: false, message: "Unable to create user" });
  }
};

// Change user role
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.role === "Admin") {
      return res.status(403).json({ success: false, message: "Admin accounts cannot be modified through this API" });
    }

    if (user.role !== role) {
      user.role = role;
      user.tokenVersion += 1;
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Update role error:", error.message);
    res.status(500).json({ success: false, message: "Unable to update user role" });
  }
};

// Activate or deactivate account
const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ success: false, message: "isActive must be true or false" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.role === "Admin") {
      return res.status(403).json({ success: false, message: "Admin accounts cannot be modified through this API" });
    }

    if (user.isActive !== isActive) {
      user.isActive = isActive;
      user.tokenVersion += 1;
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: `User account ${isActive ? "activated" : "deactivated"} successfully`,
      user: { id: user._id, name: user.name, isActive: user.isActive },
    });
  } catch (error) {
    console.error("Update status error:", error.message);
    res.status(500).json({ success: false, message: "Unable to update user status" });
  }
};

// Admin resets a user's password
const resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "New password must contain at least 8 characters" });
    }

    const user = await User.findById(req.params.id).select("+password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.role === "Admin") {
      return res.status(403).json({ success: false, message: "Admin passwords cannot be reset through this API" });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.tokenVersion += 1;
    await user.save();

    res.status(200).json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("Password reset error:", error.message);
    res.status(500).json({ success: false, message: "Unable to reset password" });
  }
};

// Get a single user by ID (Admin only)
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to fetch user" });
  }
};

// Edit user profile fields (Admin only)
const updateUser = async (req, res) => {
  try {
    const { name, email, year, className, section, rollNumber } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.role === "Admin") return res.status(403).json({ success: false, message: "Admin accounts cannot be modified through this API" });

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 80)
        return res.status(400).json({ success: false, message: "Name must be 2–80 characters" });
      user.name = name.trim();
    }
    if (email !== undefined) {
      const normalizedEmail = email.trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(normalizedEmail))
        return res.status(400).json({ success: false, message: "Enter a valid email address" });
      const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
      if (existing) return res.status(409).json({ success: false, message: "Email already in use" });
      user.email = normalizedEmail;
    }
    if (year !== undefined) user.year = Number(year);
    if (className !== undefined) user.className = String(className).trim();
    if (section !== undefined) user.section = String(section).trim();
    if (rollNumber !== undefined) user.rollNumber = String(rollNumber).trim();

    await user.save();
    res.status(200).json({ success: true, message: "User updated successfully", user: { _id: user._id, name: user.name, email: user.email, role: user.role, year: user.year, className: user.className, section: user.section, rollNumber: user.rollNumber, isActive: user.isActive } });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: "Email already in use" });
    console.error("Update user error:", error.message);
    res.status(500).json({ success: false, message: "Unable to update user" });
  }
};

// Bulk import users from CSV data
const bulkImportUsers = async (req, res) => {
  try {
    const { users: rawUsers } = req.body;
    if (!Array.isArray(rawUsers) || rawUsers.length === 0) {
      return res.status(400).json({ success: false, message: "Provide an array of users to import" });
    }
    if (rawUsers.length > 200) {
      return res.status(400).json({ success: false, message: "Maximum 200 users per import batch" });
    }
    const results = { created: 0, failed: [], skipped: 0 };
    for (const raw of rawUsers) {
      try {
        const { name, email, password, role, year, className, section, rollNumber } = raw;
        if (!name || !email || !password || !ALLOWED_ROLES.includes(role)) {
          results.failed.push({ email: email || "(missing)", reason: "Missing required fields or invalid role" });
          continue;
        }
        if (password.length < 8) {
          results.failed.push({ email, reason: "Password must be at least 8 characters" });
          continue;
        }
        const existing = await User.findOne({ email: email.trim().toLowerCase() });
        if (existing) { results.skipped++; continue; }
        const hashed = await bcrypt.hash(password, 12);
        await User.create({ name: name.trim(), email: email.trim().toLowerCase(), password: hashed, role, year: Number(year || 1), className: className || "", section: section || "", rollNumber: rollNumber || "" });
        results.created++;
      } catch (err) {
        results.failed.push({ email: raw.email || "(unknown)", reason: err.message });
      }
    }
    res.status(200).json({ success: true, message: `Import complete: ${results.created} created, ${results.skipped} skipped (email exists), ${results.failed.length} failed`, results });
  } catch (error) {
    console.error("Bulk import error:", error.message);
    res.status(500).json({ success: false, message: "Unable to process bulk import" });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserRole,
  updateUserStatus,
  resetUserPassword,
  bulkImportUsers,
};
