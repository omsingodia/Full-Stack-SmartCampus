
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      tokenVersion: user.tokenVersion,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

// Register Student
const register = async (req, res) => {
  try {
    const { name, email, password, year, className, section, rollNumber } = req.body;

    // Required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters",
      });
    }

    // Check existing account
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Public registration always creates a Student.
    // Admin/Teacher/CR roles will be assigned through authorized workflows.
    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: "Student",
      year: Number(year || 1),
      className,
      section,
      rollNumber,
    });

const token = generateToken(user);
    return res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        year: user.year,
        className: user.className,
        section: user.section,
        rollNumber: user.rollNumber,
        campusId: req.campus?._id || null,
        campusName: req.campus?.name || null,
        campusSlug: req.campus?.slug || null,
      },
    });
  } catch (error) {
    console.error("Registration error:", error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been disabled. Contact the administrator.",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

const token = generateToken(user);
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        year: user.year,
        className: user.className,
        section: user.section,
        rollNumber: user.rollNumber,
        campusId: req.campus?._id || null,
        campusName: req.campus?.name || null,
        campusSlug: req.campus?.slug || null,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};
// Get currently logged-in user
const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      year: req.user.year,
      className: req.user.className,
      section: req.user.section,
      rollNumber: req.user.rollNumber,
      campusId: req.campus?._id || null,
      campusName: req.campus?.name || null,
      campusSlug: req.campus?.slug || null,
    },
  });
};

// Update own profile (name, year, className, section — NOT role)
const updateProfile = async (req, res) => {
  try {
    const { name, year, className, section } = req.body;
    const user = req.user;

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 80)
        return res.status(400).json({ success: false, message: "Name must be 2–80 characters" });
      user.name = name.trim();
    }
    if (year !== undefined) user.year = Number(year);
    if (className !== undefined) user.className = String(className).trim();
    if (section !== undefined) user.section = String(section).trim();

    await user.save();
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: { id: user._id, name: user.name, email: user.email, role: user.role, year: user.year, className: user.className, section: user.section, rollNumber: user.rollNumber },
    });
  } catch (error) {
    console.error("Update profile error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to update profile" });
  }
};

// Change own password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: "Current password and new password are required" });
    if (typeof newPassword !== "string" || newPassword.length < 8)
      return res.status(400).json({ success: false, message: "New password must be at least 8 characters" });

    const user = await User.findById(req.user._id).select("+password");
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(401).json({ success: false, message: "Current password is incorrect" });

    user.password = await bcrypt.hash(newPassword, 12);
    user.tokenVersion += 1;
    await user.save();

    const token = generateToken(user);
    return res.status(200).json({ success: true, message: "Password changed successfully. Please use your new password on next login.", token });
  } catch (error) {
    console.error("Change password error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to change password" });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
};
