require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const Campus = require("../models/Campus");
const { runWithTenant } = require("../tenancy/context");

async function resetPasswords() {
  await mongoose.connect(process.env.MONGODB_URI);
  const slug = process.env.DEFAULT_CAMPUS_SLUG;
  if (!slug) throw new Error("Set DEFAULT_CAMPUS_SLUG to the campus you want to administer.");
  const campus = await Campus.findOne({ slug, status: "active" }).lean();
  if (!campus) throw new Error("Campus not found or inactive.");
  await runWithTenant({ tenantId: campus._id, campus }, async () => {
    const emails = ["teacher1@campus.edu", "student1@campus.edu", "teststudent@campus.edu"];
    console.log(`\nCAMPUS: ${campus.name} (${campus.slug})\n`);
    for (const email of emails) {
      const user = await User.findOne({ email }).select("+password");
      if (!user) { console.log(`Account not found: ${email}\n`); continue; }
      const password = crypto.randomBytes(16).toString("base64url");
      user.password = await bcrypt.hash(password, 12);
      user.tokenVersion += 1;
      await user.save();
      console.log(`Role: ${user.role}\nEmail: ${user.email}\nPassword: ${password}\n------------------------------`);
    }
  });
}
resetPasswords().catch(error => { console.error("Password reset failed:", error.message); process.exitCode = 1; })
.finally(async () => { if (mongoose.connection.readyState) await mongoose.disconnect(); });
