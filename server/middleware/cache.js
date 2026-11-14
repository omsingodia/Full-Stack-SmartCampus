// Small in-process TTL cache for frequently-read public reference data.
// Cache is intentionally scoped per server instance; use Redis for multi-instance deployments.
const store = new Map();
const stats = { hits: 0, misses: 0 };
function cacheGet(key) {
  const entry = store.get(key);
  if (!entry || entry.expiresAt < Date.now()) {
    if (entry) store.delete(key);
    stats.misses++;
    return null;
  }
  stats.hits++;
  return entry.value;
}
function cacheSet(key, value, ttlMs = 30000) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}
function cacheDeletePrefix(prefix) {
  for (const key of store.keys()) if (key.startsWith(prefix)) store.delete(key);
}
function cacheMetrics(req, res) {
  res.json({ success: true, cache: "in-memory TTL", hits: stats.hits, misses: stats.misses,
    entries: store.size, note: "Cache is per server instance; invalidate on writes." });
}
module.exports = { cacheGet, cacheSet, cacheDeletePrefix, cacheMetrics };
