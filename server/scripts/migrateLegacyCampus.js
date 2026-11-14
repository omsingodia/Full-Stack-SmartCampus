require("dotenv").config();
const mongoose = require("mongoose");
const Campus = require("../models/Campus");
const PlatformUser = require("../models/PlatformUser");

const collections = [
  "users", "communities", "lostfounds", "lostfoundclaims", "reports",
  "exams", "examduties", "examseats", "examrequests", "contactmessages"
];

async function main() {
  const { MONGODB_URI, LEGACY_CAMPUS_NAME, LEGACY_CAMPUS_INSTITUTION, LEGACY_CAMPUS_SLUG, PLATFORM_OWNER_EMAIL } = process.env;
  if (![MONGODB_URI, LEGACY_CAMPUS_NAME, LEGACY_CAMPUS_INSTITUTION, LEGACY_CAMPUS_SLUG, PLATFORM_OWNER_EMAIL].every(Boolean)) {
    throw new Error("Set MONGODB_URI, LEGACY_CAMPUS_NAME, LEGACY_CAMPUS_INSTITUTION, LEGACY_CAMPUS_SLUG and PLATFORM_OWNER_EMAIL.");
  }
  await mongoose.connect(MONGODB_URI);
  const owner = await PlatformUser.findOne({ email: PLATFORM_OWNER_EMAIL.toLowerCase().trim() });
  if (!owner) throw new Error("Create the Platform Owner first with npm run platform:create-owner.");
  let campus = await Campus.findOne({ slug: LEGACY_CAMPUS_SLUG.toLowerCase().trim() });
  if (!campus) campus = await Campus.create({
    name: LEGACY_CAMPUS_NAME, institutionName: LEGACY_CAMPUS_INSTITUTION,
    slug: LEGACY_CAMPUS_SLUG.toLowerCase().trim(), status: "active", createdBy: owner._id
  });
  const db = mongoose.connection.db;
  for (const name of collections) {
    const exists = await db.listCollections({ name }).hasNext();
    if (!exists) continue;
    const result = await db.collection(name).updateMany(
      { tenantId: { $exists: false } },
      { $set: { tenantId: campus._id } }
    );
    console.log(`${name}: migrated ${result.modifiedCount} records`);
  }
  try { await db.collection("users").dropIndex("email_1"); } catch (e) {
    if (e.codeName !== "IndexNotFound" && e.code !== 27) throw e;
  }
  await db.collection("users").createIndex({ tenantId: 1, email: 1 }, { unique: true, name: "tenant_email_unique" });
  console.log(`Legacy records are now assigned to campus ${campus.slug}.`);
}
main().catch(e => { console.error(e.message); process.exitCode = 1; }).finally(async () => {
  if (mongoose.connection.readyState) await mongoose.disconnect();
});
