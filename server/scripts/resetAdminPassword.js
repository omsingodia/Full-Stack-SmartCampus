
require("dotenv").config();

const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const resetAdminPassword = async () => {
  try {
    const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw new Error("ADMIN_EMAIL or ADMIN_PASSWORD is missing");
    }

    if (ADMIN_PASSWORD.length < 12) {
      throw new Error("Password must contain at least 12 characters");
    }

    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing");
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
    });

    console.log("MongoDB connected");

    const admin = await User.findOne({
      email: ADMIN_EMAIL.toLowerCase().trim(),
      role: "Admin",
    }).select("+password");

    if (!admin) {
      throw new Error("No Admin account found with this email");
    }

    admin.password = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await admin.save();

    console.log("Admin password reset successfully!");
    console.log("Admin Email:", admin.email);
    console.log("Role:", admin.role);

  } catch (error) {
    console.error("Password reset failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

resetAdminPassword();
