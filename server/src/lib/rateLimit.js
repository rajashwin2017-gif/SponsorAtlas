// Fixed-window rate limiter. In-memory (fine for a single instance).
const buckets = new Map();
const MAX_BUCKETS = 10_000;

function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) buckets.clear();
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true };
  }

  if (existing.count >= limit) {
    return { success: false };
  }

  existing.count += 1;
  return { success: true };
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.ip || "unknown";
}

module.exports = { rateLimit, getClientIp };
