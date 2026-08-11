import { headers } from 'next/headers';

type RateLimitOptions = {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
};

type RecordEntry = {
  tokens: number;
  resetAt: number;
};

// Memory store mapping actionKey:clientIp -> RecordEntry
const memoryStore = new Map<string, RecordEntry>();

// Cleanup stale entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryStore.entries()) {
      if (now > entry.resetAt) {
        memoryStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Get client IP address from request headers
 */
export async function getClientIp(): Promise<string> {
  try {
    const headerList = await headers();
    const forwarded = headerList.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    const realIp = headerList.get('x-real-ip');
    if (realIp) {
      return realIp.trim();
    }
  } catch (error) {
    // Header access might fail in non-RSC contexts
  }
  return '127.0.0.1';
}

/**
 * Check if the current request exceeds rate limits.
 * Returns true if allowed, false if limit exceeded.
 */
export async function checkRateLimit(
  actionName: string,
  options: RateLimitOptions = { limit: 20, windowMs: 60 * 1000 }
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const ip = await getClientIp();
  const key = `${actionName}:${ip}`;
  const now = Date.now();

  const entry = memoryStore.get(key);

  if (!entry || now > entry.resetAt) {
    memoryStore.set(key, {
      tokens: options.limit - 1,
      resetAt: now + options.windowMs,
    });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (entry.tokens > 0) {
    entry.tokens -= 1;
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
  return { allowed: false, retryAfterSeconds };
}

/**
 * Enforce rate limit. Throws an Error if rate limit is exceeded.
 */
export async function enforceRateLimit(
  actionName: string,
  options: RateLimitOptions = { limit: 20, windowMs: 60 * 1000 }
) {
  const { allowed, retryAfterSeconds } = await checkRateLimit(actionName, options);
  if (!allowed) {
    throw new Error(
      `Trop de requêtes (${actionName}). Veuillez réespacer vos actions et réessayer dans ${retryAfterSeconds}s.`
    );
  }
}
