
const mongoose = require("mongoose");

const lostFoundSchema = new mongoose.Schema(
  {
    itemType: {
      type: String,
      enum: ["Lost", "Found"],
      required: true,
    },

    title: {
      type: String,
      required: [true, "Item title is required"],
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: 1000,
    },

    category: {
      type: String,
      required: true,
      enum: [
        "Electronics",
        "Documents",
        "Books",
        "Accessories",
        "Clothing",
        "Other",
      ],
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    date: {
      type: Date,
      required: true,
    },

    images: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CampusCareImage",
  },
],

    status: {
      type: String,
      enum: ["Open", "Claim Pending", "Resolved", "Rejected"],
      default: "Open",
    },

    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

lostFoundSchema.index({ itemType: 1, status: 1 });
lostFoundSchema.index({ category: 1, location: 1 });

lostFoundSchema.plugin(require("../tenancy/tenantScopePlugin"));
const LostFound = mongoose.model("LostFound", lostFoundSchema);

module.exports = LostFound;
