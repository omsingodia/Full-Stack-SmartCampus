const { getTenant } = require("./context");

/**
 * Fail-closed tenant isolation for campus-owned collections.
 * Every read/write query is constrained to the active tenant.
 * Platform collections (Campus, PlatformUser) must NOT use this plugin.
 */
module.exports = function tenantScopePlugin(schema) {
  if (!schema.path("tenantId")) {
    schema.add({
      tenantId: {
        type: require("mongoose").Schema.Types.ObjectId,
        ref: "Campus",
        required: true,
        immutable: true,
        index: true,
      },
    });
  }

  // Populate tenantId before Mongoose's required-field validation runs.
  // A pre-save hook is too late because validation executes before pre-save.
  schema.pre("validate", function () {
    const tenant = getTenant();
    if (!tenant?.tenantId) throw new Error("Tenant context is required");
    if (this.tenantId && String(this.tenantId) !== String(tenant.tenantId)) {
      throw new Error("Cross-campus write blocked");
    }
    this.tenantId = tenant.tenantId;
  });

  schema.pre("save", function () {
    const tenant = getTenant();
    if (!tenant?.tenantId) throw new Error("Tenant context is required");
    if (this.tenantId && String(this.tenantId) !== String(tenant.tenantId)) {
      throw new Error("Cross-campus write blocked");
    }
    this.tenantId = tenant.tenantId;
  });

  schema.pre("insertMany", function (next, docs) {
    const tenant = getTenant();
    if (!tenant?.tenantId) return next(new Error("Tenant context is required"));
    for (const doc of docs) {
      if (doc.tenantId && String(doc.tenantId) !== String(tenant.tenantId)) {
        return next(new Error("Cross-campus write blocked"));
      }
      doc.tenantId = tenant.tenantId;
    }
    next();
  });

  const queryOps = [
    "find", "findOne", "countDocuments", "estimatedDocumentCount",
    "findOneAndUpdate", "updateOne", "updateMany", "deleteOne",
    "deleteMany", "findOneAndDelete", "findOneAndReplace",
  ];
  for (const op of queryOps) {
    schema.pre(op, function () {
      const tenant = getTenant();
      if (!tenant?.tenantId) throw new Error("Tenant context is required");
      const filter = this.getFilter();
      if (filter.tenantId && String(filter.tenantId) !== String(tenant.tenantId)) {
        throw new Error("Cross-campus query blocked");
      }
      this.setQuery({ ...filter, tenantId: tenant.tenantId });
      if (["updateOne", "updateMany", "findOneAndUpdate", "findOneAndReplace"].includes(op)) {
        const update = this.getUpdate() || {};
        if (update.tenantId && String(update.tenantId) !== String(tenant.tenantId)) {
          throw new Error("Cross-campus write blocked");
        }
        this.setUpdate({ ...update, $set: { ...(update.$set || {}), tenantId: tenant.tenantId } });
      }
    });
  }

  schema.pre("aggregate", function () {
    const tenant = getTenant();
    if (!tenant?.tenantId) throw new Error("Tenant context is required");
    this.pipeline().unshift({ $match: { tenantId: tenant.tenantId } });
  });

  schema.index({ tenantId: 1, createdAt: -1 });
};
