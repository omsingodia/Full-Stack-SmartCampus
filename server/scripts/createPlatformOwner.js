require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const PlatformUser = require("../models/PlatformUser");

async function main() {
  const { MONGODB_URI, PLATFORM_OWNER_NAME, PLATFORM_OWNER_EMAIL, PLATFORM_OWNER_PASSWORD } = process.env;
  if (!MONGODB_URI || !PLATFORM_OWNER_NAME || !PLATFORM_OWNER_EMAIL || !PLATFORM_OWNER_PASSWORD) {
    throw new Error("Set MONGODB_URI, PLATFORM_OWNER_NAME, PLATFORM_OWNER_EMAIL and PLATFORM_OWNER_PASSWORD in server/.env");
  }
  if (PLATFORM_OWNER_PASSWORD.length < 16) throw new Error("Platform owner password must be at least 16 characters.");
  await mongoose.connect(MONGODB_URI);
  const email = PLATFORM_OWNER_EMAIL.toLowerCase().trim();
  const existing = await PlatformUser.findOne({ email });
  if (existing) throw new Error("Platform owner already exists. Use the password rotation workflow instead.");
  await PlatformUser.create({
    name: PLATFORM_OWNER_NAME,
    email,
    password: await bcrypt.hash(PLATFORM_OWNER_PASSWORD, 12),
    role: "PlatformOwner"
  });
  console.log("Platform owner created. Keep credentials private and enable MFA before public launch.");
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(async () => {
  if (mongoose.connection.readyState) await mongoose.disconnect();
});
