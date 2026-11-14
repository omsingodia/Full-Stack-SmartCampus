const test = require("node:test");
const assert = require("node:assert/strict");
const { runWithTenant, getTenant } = require("../tenancy/context");

test("tenant context is isolated between asynchronous request scopes", async () => {
  const a = { tenantId: "campus-a" };
  const b = { tenantId: "campus-b" };
  const [first, second] = await Promise.all([
    new Promise(resolve => runWithTenant(a, async () => {
      await new Promise(r => setTimeout(r, 10));
      resolve(getTenant().tenantId);
    })),
    new Promise(resolve => runWithTenant(b, async () => {
      await new Promise(r => setTimeout(r, 1));
      resolve(getTenant().tenantId);
    }))
  ]);
  assert.equal(first, "campus-a");
  assert.equal(second, "campus-b");
  assert.equal(getTenant(), null);
});
