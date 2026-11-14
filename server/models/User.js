
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 80,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: false,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Enter a valid email address"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
      minlength: 8,
    },

    role: {
      type: String,
      enum: ["Student", "Student CR", "Teacher", "Admin"],
      default: "Student",
      required: true,
    },

    year: { type: Number, min: 1, max: 4, default: 1 },

    className: {
      type: String,
      trim: true,
      default: "",
    },

    section: {
      type: String,
      trim: true,
      default: "",
    },

    rollNumber: {
      type: String,
      trim: true,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    tokenVersion: {
  type: Number,
  default: 0,
},
  },
  {
    timestamps: true,
  }
);

userSchema.index({ tenantId: 1, email: 1 }, { unique: true });
userSchema.plugin(require("../tenancy/tenantScopePlugin"));
const User = mongoose.model("User", userSchema);

module.exports = User;
