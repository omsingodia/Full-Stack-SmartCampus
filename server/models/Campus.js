const mongoose = require("mongoose");

const campusSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 140 },
  slug: { type: String, required: true, lowercase: true, trim: true, unique: true, match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/ },
  institutionName: { type: String, required: true, trim: true, maxlength: 180 },
  primaryDomain: { type: String, lowercase: true, trim: true, default: "" },
  domains: [{ type: String, lowercase: true, trim: true }],
  status: { type: String, enum: ["provisioning", "active", "suspended"], default: "provisioning" },
  plan: { type: String, enum: ["pilot", "standard", "enterprise"], default: "pilot" },
  settings: {
    timezone: { type: String, default: "Asia/Kolkata" },
    academicYears: { type: Number, default: 4, min: 1, max: 8 },
    allowStudentRegistration: { type: Boolean, default: true },
    requireVerifiedEmail: { type: Boolean, default: false }
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "PlatformUser", required: false, default: null }
}, { timestamps: true });

campusSchema.index({ domains: 1 });
module.exports = mongoose.model("Campus", campusSchema);
