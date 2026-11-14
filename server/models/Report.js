
const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    reportId: {
      type: String,
      unique: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    category: {
      type: String,
      required: true,
      enum: [
        "Maintenance",
        "Electrical",
        "Cleanliness",
        "Furniture",
        "Safety",
        "Vandalism",
        "Damage",
        "Littering",
        "Other",
      ],
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },

    status: {
      type: String,
      enum: [
        "Submitted",
        "Under Review",
        "Assigned",
        "In Progress",
        "Resolved",
        "Rejected",
      ],
      default: "Submitted",
    },

    images: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CampusCareImage",
      },
    ],

    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    assignedTeam: { type: String, enum: ["Maintenance Team","Electrical Team","Housekeeping Team","Furniture Team","Security Team","General Support"], default: "General Support" },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    resolutionNote: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Automatically generate report ID
reportSchema.pre("validate", function () {
  if (!this.reportId) {
    this.reportId =
      "CC-" +
      Date.now().toString().slice(-8) +
      Math.floor(100 + Math.random() * 900);
  }
});

reportSchema.index({ reportedBy: 1, createdAt: -1 });
reportSchema.index({ status: 1, priority: 1 });

reportSchema.plugin(require("../tenancy/tenantScopePlugin"));
module.exports = mongoose.model("Report", reportSchema);
