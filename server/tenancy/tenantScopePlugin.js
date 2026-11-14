
const mongoose = require("mongoose");
const { getTenant } = require("./context");

/**
 * Fail-closed tenant isolation for campus-owned collections.
 * Campus and PlatformUser schemas must NOT use this plugin.
 */
module.exports = function tenantScopePlugin(schema) {
  if (!schema.path("tenantId")) {
    schema.add({
      tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Campus",
        required: true,
        immutable: true,
        index: true,
      },
    });
  }

  // Resolve tenant before Mongoose required-field validation.
  schema.pre("validate", function () {
    const tenant = getTenant();

    if (!tenant?.tenantId) {
      throw new Error("Tenant context is required");
    }

    if (
      this.tenantId &&
      String(this.tenantId) !== String(tenant.tenantId)
    ) {
      throw new Error("Cross-campus write blocked");
    }

    this.tenantId = tenant.tenantId;
  });

  // Additional protection before saving.
  schema.pre("save", function () {
    const tenant = getTenant();

    if (!tenant?.tenantId) {
      throw new Error("Tenant context is required");
    }

    if (
      this.tenantId &&
      String(this.tenantId) !== String(tenant.tenantId)
    ) {
      throw new Error("Cross-campus write blocked");
    }

    this.tenantId = tenant.tenantId;
  });

  // Protect insertMany operations.
  schema.pre("insertMany", function (next, docs) {
    try {
      const tenant = getTenant();

      if (!tenant?.tenantId) {
        return next(new Error("Tenant context is required"));
      }

      for (const doc of docs) {
        if (
          doc.tenantId &&
          String(doc.tenantId) !== String(tenant.tenantId)
        ) {
          return next(new Error("Cross-campus write blocked"));
        }

        doc.tenantId = tenant.tenantId;
      }

      next();
    } catch (error) {
      next(error);
    }
  });

  // Tenant-scoped query operations.
  const queryOps = [
    "find",
    "findOne",
    "countDocuments",
    "findOneAndUpdate",
    "updateOne",
    "updateMany",
    "deleteOne",
    "deleteMany",
    "findOneAndDelete",
    "findOneAndReplace",
  ];

  for (const op of queryOps) {
    schema.pre(op, function () {
      const tenant = getTenant();

      if (!tenant?.tenantId) {
        throw new Error("Tenant context is required");
      }

      const filter = this.getFilter();

      if (
        filter.tenantId &&
        String(filter.tenantId) !== String(tenant.tenantId)
      ) {
        throw new Error("Cross-campus query blocked");
      }

      this.setQuery({
        ...filter,
        tenantId: tenant.tenantId,
      });

      if (
        [
          "updateOne",
          "updateMany",
          "findOneAndUpdate",
          "findOneAndReplace",
        ].includes(op)
      ) {
        const update = this.getUpdate() || {};

        if (Array.isArray(update)) {
          throw new Error(
            "Aggregation pipeline updates are not allowed on tenant-scoped models"
          );
        }

        if (
          update.tenantId &&
          String(update.tenantId) !== String(tenant.tenantId)
        ) {
          throw new Error("Cross-campus write blocked");
        }

        if (
          update.$set?.tenantId &&
          String(update.$set.tenantId) !== String(tenant.tenantId)
        ) {
          throw new Error("Cross-campus write blocked");
        }

        this.setUpdate({
          ...update,
          $set: {
            ...(update.$set || {}),
            tenantId: tenant.tenantId,
          },
        });
      }
    });
  }

  // estimatedDocumentCount ignores filters, so block it.
  // Use countDocuments() for tenant-scoped counts.
  schema.pre("estimatedDocumentCount", function () {
    throw new Error(
      "Use countDocuments() for tenant-scoped collections"
    );
  });

  // Tenant-scoped aggregation.
  schema.pre("aggregate", function () {
    const tenant = getTenant();

    if (!tenant?.tenantId) {
      throw new Error("Tenant context is required");
    }

    const pipeline = this.pipeline();

    // $geoNear must remain the first aggregation stage.
    if (pipeline[0]?.$geoNear) {
      pipeline.splice(1, 0, {
        $match: { tenantId: tenant.tenantId },
      });
    } else {
      pipeline.unshift({
        $match: { tenantId: tenant.tenantId },
      });
    }
  });

  schema.index({ tenantId: 1, createdAt: -1 });
};
