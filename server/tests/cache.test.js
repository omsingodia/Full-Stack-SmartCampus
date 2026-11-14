const test = require("node:test");
const assert = require("node:assert/strict");
const { cacheGet, cacheSet, cacheDeletePrefix } = require("../middleware/cache");

test("cache records a miss then a hit", () => {
  const key = `test:${Date.now()}`;
  assert.equal(cacheGet(key), null);
  cacheSet(key, { value: 42 }, 1000);
  assert.deepEqual(cacheGet(key), { value: 42 });
  cacheDeletePrefix(key);
});

test("cache invalidation removes matching keys", () => {
  const prefix = `invalidate:${Date.now()}`;
  cacheSet(`${prefix}:one`, 1, 1000);
  cacheSet(`${prefix}:two`, 2, 1000);
  cacheDeletePrefix(prefix);
  assert.equal(cacheGet(`${prefix}:one`), null);
  assert.equal(cacheGet(`${prefix}:two`), null);
});
