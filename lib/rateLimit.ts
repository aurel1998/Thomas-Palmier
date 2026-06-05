type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function pruneExpired(now: number): void {
  if (buckets.size < 500) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function isRateLimited(
  key: string,
  maxAttempts: number,
  windowMs: number
): boolean {
  const normalized = key.trim().toLowerCase();
  if (!normalized) return false;

  const now = Date.now();
  pruneExpired(now);

  const bucket = buckets.get(normalized);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(normalized, { count: 1, resetAt: now + windowMs });
    return false;
  }

  bucket.count += 1;
  return bucket.count > maxAttempts;
}

export function resetRateLimit(key: string): void {
  buckets.delete(key.trim().toLowerCase());
}
