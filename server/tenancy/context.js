const { AsyncLocalStorage } = require("node:async_hooks");
const storage = new AsyncLocalStorage();

const runWithTenant = (tenant, callback) => storage.run(tenant, callback);
const getTenant = () => storage.getStore() || null;

module.exports = { runWithTenant, getTenant };
