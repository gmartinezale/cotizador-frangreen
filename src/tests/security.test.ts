import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/headers before importing security module
vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

// Mock mongo and rateLimit model so checkRateLimit doesn't hit a real DB
vi.mock("@/lib/mongo", () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/models/rateLimit", () => ({
  default: {
    findOneAndUpdate: vi.fn(),
  },
}));

import { headers } from "next/headers";
import RateLimitModel from "@/models/rateLimit";
import {
  isValidObjectId,
  getClientIP,
  validateOrigin,
  checkRateLimit,
} from "@/lib/security";

// Helper: sets a fresh implementation on the headers() mock for the next call(s)
function mockHeadersMap(map: Record<string, string | null>) {
  vi.mocked(headers).mockImplementation(() =>
    Promise.resolve({ get: (key: string) => map[key] ?? null } as never),
  );
}

// ---------------------------------------------------------------------------
// isValidObjectId
// ---------------------------------------------------------------------------
describe("isValidObjectId", () => {
  it("accepts a valid 24-character hex ObjectId", () => {
    expect(isValidObjectId("507f1f77bcf86cd799439011")).toBe(true);
  });

  it("rejects arbitrary strings", () => {
    expect(isValidObjectId("not-an-id")).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isValidObjectId("")).toBe(false);
  });

  it("rejects SQL injection payloads", () => {
    expect(isValidObjectId("' OR '1'='1")).toBe(false);
  });

  it("rejects strings longer than 24 chars", () => {
    expect(isValidObjectId("507f1f77bcf86cd799439011EXTRA")).toBe(false);
  });

  it("rejects NoSQL operator strings", () => {
    expect(isValidObjectId('{"$gt": ""}')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getClientIP
// ---------------------------------------------------------------------------
describe("getClientIP", () => {
  it("prefers x-real-ip over x-forwarded-for", async () => {
    mockHeadersMap({ "x-real-ip": "1.2.3.4", "x-forwarded-for": "9.9.9.9, 8.8.8.8" });
    expect(await getClientIP()).toBe("1.2.3.4");
  });

  it("falls back to the first IP in x-forwarded-for when x-real-ip is absent", async () => {
    mockHeadersMap({ "x-real-ip": null, "x-forwarded-for": "5.5.5.5, 6.6.6.6" });
    expect(await getClientIP()).toBe("5.5.5.5");
  });

  it("trims whitespace from x-forwarded-for entries", async () => {
    mockHeadersMap({ "x-real-ip": null, "x-forwarded-for": "  203.0.113.1 , 10.0.0.1" });
    expect(await getClientIP()).toBe("203.0.113.1");
  });

  it("returns 'unknown' when no IP header is present", async () => {
    mockHeadersMap({ "x-real-ip": null, "x-forwarded-for": null });
    expect(await getClientIP()).toBe("unknown");
  });

  it("prevents IP spoofing: x-real-ip (Vercel-injected) wins over spoofed x-forwarded-for", async () => {
    // Attacker injects a fake IP as first entry, but x-real-ip is authoritative
    mockHeadersMap({ "x-real-ip": "203.0.113.5", "x-forwarded-for": "1.1.1.1, 203.0.113.5" });
    expect(await getClientIP()).toBe("203.0.113.5");
  });
});

// ---------------------------------------------------------------------------
// validateOrigin
// ---------------------------------------------------------------------------
describe("validateOrigin", () => {
  // validateOrigin derives the host from request.url (not the Host header,
  // which is a forbidden header and cannot be set in new Request()).
  // Pass the target URL as first arg to control the host in tests.

  function makeReq(origin: string | null, reqUrl = "https://example.com/api") {
    const hdrs: Record<string, string> = {};
    if (origin) hdrs["origin"] = origin;
    return new Request(reqUrl, { headers: hdrs });
  }

  it("allows requests with no origin header (server-to-server)", async () => {
    expect(await validateOrigin(makeReq(null))).toBe(true);
  });

  it("allows requests when origin host matches the request URL host", async () => {
    expect(await validateOrigin(makeReq("https://example.com"))).toBe(true);
  });

  it("blocks CSRF: origin from a different domain", async () => {
    expect(await validateOrigin(makeReq("https://evil.com"))).toBe(false);
  });

  it("blocks CSRF: origin is a subdomain of the host", async () => {
    expect(await validateOrigin(makeReq("https://attacker.example.com"))).toBe(false);
  });

  it("allows localhost origin in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(await validateOrigin(makeReq("http://localhost:3000", "http://localhost:3000/api"))).toBe(true);
    vi.unstubAllEnvs();
  });

  it("blocks localhost origin outside development", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(await validateOrigin(makeReq("http://localhost:3000"))).toBe(false);
    vi.unstubAllEnvs();
  });

  it("allows origin that matches BASE_URL env var", async () => {
    vi.stubEnv("BASE_URL", "https://myapp.vercel.app");
    // Request URL has a different host, but BASE_URL matches the origin
    expect(await validateOrigin(makeReq("https://myapp.vercel.app", "https://other.com/api"))).toBe(true);
    vi.unstubAllEnvs();
  });

  it("blocks a malformed origin string", async () => {
    expect(await validateOrigin(makeReq("not-a-url"))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// checkRateLimit
// ---------------------------------------------------------------------------
describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows the request when count is within the limit", async () => {
    vi.mocked(RateLimitModel.findOneAndUpdate).mockResolvedValueOnce({ count: 3 } as never);
    const result = await checkRateLimit("test:1.2.3.4", { windowMs: 60000, maxRequests: 5 });
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("blocks the request once count exceeds the limit (count > maxRequests)", async () => {
    // maxRequests:5 allows requests 1-5 (count<=5 succeeds); count=6 is the first blocked
    vi.mocked(RateLimitModel.findOneAndUpdate).mockResolvedValueOnce({ count: 6 } as never);
    const result = await checkRateLimit("test:1.2.3.4", { windowMs: 60000, maxRequests: 5 });
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("blocks when count exceeds the limit", async () => {
    vi.mocked(RateLimitModel.findOneAndUpdate).mockResolvedValueOnce({ count: 10 } as never);
    const result = await checkRateLimit("test:1.2.3.4", { windowMs: 60000, maxRequests: 5 });
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("uses atomic upsert with the correct identifier key", async () => {
    vi.mocked(RateLimitModel.findOneAndUpdate).mockResolvedValueOnce({ count: 1 } as never);
    await checkRateLimit("login:192.168.1.1", { windowMs: 60000, maxRequests: 5 });
    expect(RateLimitModel.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ key: "login:192.168.1.1" }),
      expect.objectContaining({ $inc: { count: 1 } }),
      expect.objectContaining({ upsert: true, new: true }),
    );
  });

  it("uses different window configs independently", async () => {
    vi.mocked(RateLimitModel.findOneAndUpdate).mockResolvedValueOnce({ count: 1 } as never);
    await checkRateLimit("api:test", { windowMs: 30000, maxRequests: 3 });
    const call = vi.mocked(RateLimitModel.findOneAndUpdate).mock.calls[0];
    // resetAt should be approximately 30s from now
    const setOnInsert = call[1].$setOnInsert as { resetAt: Date };
    expect(setOnInsert.resetAt.getTime()).toBeGreaterThan(Date.now() + 29000);
    expect(setOnInsert.resetAt.getTime()).toBeLessThan(Date.now() + 31000);
  });

  it("falls back to in-memory limiter when MongoDB throws", async () => {
    vi.mocked(RateLimitModel.findOneAndUpdate).mockRejectedValueOnce(
      new Error("DB connection failed"),
    );
    // With in-memory fallback, first request should succeed
    const result = await checkRateLimit("fallback:1.2.3.4", { windowMs: 60000, maxRequests: 10 });
    expect(result.success).toBe(true);
  });
});
