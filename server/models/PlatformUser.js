const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ["PlatformOwner", "PlatformSupport"], default: "PlatformOwner" },
  isActive: { type: Boolean, default: true },
  tokenVersion: { type: Number, default: 0 }
}, { timestamps: true });
schema.index({ email: 1 }, { unique: true });
module.exports = mongoose.model("PlatformUser", schema);
