import "server-only";
import { headers } from "next/headers";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongo";
import RateLimit from "@/models/rateLimit";

/**
 * Validates that a string is a valid MongoDB ObjectId
 * Prevents NoSQL injection attacks
 */
export function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * Returns a 400 response for invalid ObjectId
 */
export function invalidIdResponse() {
  return new Response(
    JSON.stringify({ success: false, message: "ID inválido" }),
    { status: 400 }
  );
}

/**
 * Returns a 401 response for unauthorized access
 */
export function unauthorizedResponse() {
  return new Response(
    JSON.stringify({ success: false, message: "No autorizado" }),
    { status: 401 }
  );
}

/**
 * Returns a 429 response for rate limiting
 */
export function rateLimitResponse() {
  return new Response(
    JSON.stringify({ success: false, message: "Demasiadas solicitudes. Intenta de nuevo más tarde." }),
    { status: 429 }
  );
}

/**
 * Validates the request origin to prevent CSRF attacks
 * Should be used in API routes that modify data
 */
export async function validateOrigin(request: Request): Promise<boolean> {
  const origin = request.headers.get("origin");

  // Allow requests without origin (same-origin server requests)
  if (!origin) return true;

  // In development, allow localhost
  if (process.env.NODE_ENV === "development") {
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return true;
    }
  }

  // Check if origin matches the request host.
  // We derive the host from request.url instead of the Host header because
  // "Host" is a forbidden request header in the Fetch API and cannot be set
  // programmatically (e.g. in tests or certain proxy setups).
  try {
    const originUrl = new URL(origin);
    const requestHost = new URL(request.url).host;
    // Guard BASE_URL / APP_URL parsing — Vite overrides BASE_URL to "/" which
    // would throw. Use APP_URL (project-specific) or fall back to BASE_URL.
    const appUrlRaw = process.env.APP_URL ?? process.env.BASE_URL;
    let appUrlHost: string | null = null;
    try {
      appUrlHost = appUrlRaw ? new URL(appUrlRaw).host : null;
    } catch {
      appUrlHost = null;
    }
    const allowedHosts = [requestHost, appUrlHost, process.env.VERCEL_URL].filter(Boolean);

    return allowedHosts.some(h => h && originUrl.host === h);
  } catch {
    return false;
  }
}

/**
 * Simple in-memory rate limiter used as fallback in development.
 * WARNING: NOT effective in serverless production (state resets per invocation).
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

/**
 * MongoDB-backed rate limiter. Works across all serverless instances.
 * Falls back to in-memory map if DB is unavailable.
 * Uses atomic $inc to prevent race conditions.
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 10 }
): Promise<{ success: boolean; remaining: number }> {
  try {
    await connectDB();
    const now = new Date();
    const resetAt = new Date(now.getTime() + config.windowMs);

    // Atomic upsert: create a new window if the key doesn't exist, or increment if it does.
    // The TTL index on resetAt handles automatic expiry.
    const record = await RateLimit.findOneAndUpdate(
      { key: identifier, resetAt: { $gt: now } },
      { $inc: { count: 1 }, $setOnInsert: { resetAt } },
      { upsert: true, new: true }
    );

    const remaining = Math.max(0, config.maxRequests - record.count);
    const success = record.count <= config.maxRequests;
    return { success, remaining };
  } catch {
    // In-memory fallback (development / DB unreachable)
    const now = Date.now();
    const record = rateLimitMap.get(identifier);

    // Clean up old entries periodically
    if (rateLimitMap.size > 10000) {
      const keysToDelete: string[] = [];
      rateLimitMap.forEach((value, key) => {
        if (value.resetTime < now) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach((key) => rateLimitMap.delete(key));
    }

    if (!record || record.resetTime < now) {
      rateLimitMap.set(identifier, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return { success: true, remaining: config.maxRequests - 1 };
    }

    if (record.count >= config.maxRequests) {
      return { success: false, remaining: 0 };
    }

    record.count++;
    return { success: true, remaining: config.maxRequests - record.count };
  }
}

/**
 * Get client IP for rate limiting.
 * Uses x-real-ip (set by Vercel, not spoofable by clients) as primary source.
 */
export async function getClientIP(): Promise<string> {
  const headersList = await headers();
  return (
    headersList.get("x-real-ip") ||
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

/**
 * Sanitizes log output for production
 * Removes sensitive data from being logged
 */
export function safeLog(message: string, data?: unknown) {
  if (process.env.NODE_ENV === "production") {
    // In production, log minimal info without sensitive data
    console.log(message);
  } else {
    // In development, log everything
    console.log(message, data);
  }
}

/**
 * Sanitizes error logging for production
 */
export function safeErrorLog(message: string, error?: unknown) {
  if (process.env.NODE_ENV === "production") {
    // In production, don't expose error details
    console.error(message);
  } else {
    // In development, log full error
    console.error(message, error);
  }
}
