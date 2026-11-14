
require("dotenv").config();

const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");
const User = require("../models/User");

async function checkAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
    });

    const admins = await User.find({ role: "Admin" })
      .select("name email role isActive");

    if (admins.length === 0) {
      console.log("No Admin accounts found.");
    } else {
      console.log("Existing Admin accounts:");

      admins.forEach((admin) => {
        console.log({
          name: admin.name,
          email: admin.email,
          role: admin.role,
          isActive: admin.isActive,
        });
      });
    }
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkAdmin();
