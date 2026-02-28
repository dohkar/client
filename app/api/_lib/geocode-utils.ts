import { NextRequest } from "next/server";

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60;
const REVERSE_GEOCODE_CACHE_TTL_MS = 5 * 60_000; // 5 minutes
const CACHE_KEY_PRECISION = 4; // decimal places for lat/lon

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

/**
 * Returns true if request is allowed, false if rate limit exceeded.
 * Call recordGeocodeRequest(ip) after a successful request.
 */
export function checkGeocodeRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  if (!entry) return true;
  if (now >= entry.resetAt) {
    rateLimitStore.delete(ip);
    return true;
  }
  return entry.count < RATE_LIMIT_MAX_REQUESTS;
}

export function recordGeocodeRequest(ip: string): void {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  if (!entry || now >= entry.resetAt) {
    rateLimitStore.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return;
  }
  entry.count++;
}

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const reverseGeocodeCache = new Map<string, CacheEntry>();
const CACHE_SWEEP_INTERVAL = 100;
let cacheSweepCounter = 0;

function cacheKey(lat: number, lon: number): string {
  const r = 10 ** CACHE_KEY_PRECISION;
  return `${Math.round(lat * r) / r},${Math.round(lon * r) / r}`;
}

function sweepExpired(): void {
  cacheSweepCounter++;
  if (cacheSweepCounter % CACHE_SWEEP_INTERVAL !== 0) return;
  const now = Date.now();
  for (const [key, entry] of reverseGeocodeCache.entries()) {
    if (now >= entry.expiresAt) reverseGeocodeCache.delete(key);
  }
}

export function getReverseGeocodeCached(lat: number, lon: number): unknown | null {
  sweepExpired();
  const key = cacheKey(lat, lon);
  const entry = reverseGeocodeCache.get(key);
  if (!entry) return null;
  if (Date.now() >= entry.expiresAt) {
    reverseGeocodeCache.delete(key);
    return null;
  }
  return entry.data;
}

export function setReverseGeocodeCached(lat: number, lon: number, data: unknown): void {
  const key = cacheKey(lat, lon);
  reverseGeocodeCache.set(key, {
    data,
    expiresAt: Date.now() + REVERSE_GEOCODE_CACHE_TTL_MS,
  });
}
