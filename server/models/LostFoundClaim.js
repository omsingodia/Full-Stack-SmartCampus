
const mongoose = require("mongoose");

const lostFoundClaimSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LostFound",
      required: true,
    },

    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    message: {
      type: String,
      required: [true, "Claim message is required"],
      trim: true,
      maxlength: 1000,
    },

    proofDescription: {
      type: String,
      required: [true, "Ownership proof is required"],
      trim: true,
      maxlength: 1000,
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewMessage: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Prevent the same student from submitting duplicate claims
lostFoundClaimSchema.index(
  { item: 1, claimedBy: 1 },
  { unique: true }
);

// Useful for claim management
lostFoundClaimSchema.index({ status: 1, createdAt: -1 });

lostFoundClaimSchema.plugin(require("../tenancy/tenantScopePlugin"));
const LostFoundClaim = mongoose.model(
  "LostFoundClaim",
  lostFoundClaimSchema
);

module.exports = LostFoundClaim;
