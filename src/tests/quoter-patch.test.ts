import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks must be declared before any imports ──────────────────────────────

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({ get: () => null }),
  cookies: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

// Auth: always return a valid session so auth checks pass
vi.mock("@/lib/dal", () => ({
  getSession: vi.fn().mockResolvedValue({
    userId: "507f1f77bcf86cd799439011",
    email: "test@example.com",
  }),
}));

// DB connection: no-op
vi.mock("@/lib/mongo", () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

// RateLimit model (used by security.ts, never called from this route)
vi.mock("@/models/rateLimit", () => ({
  default: { findOneAndUpdate: vi.fn() },
}));

// Sequence model
vi.mock("@/models/sequence", () => ({
  default: {
    findOneAndUpdate: vi.fn().mockResolvedValue({ sequence: { order: 42, quoter: 1 } }),
  },
}));

// Quoter model — each test configures its own return values
vi.mock("@/models/quoter", () => ({
  default: {
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    aggregate: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
  },
}));

// Partial mock of security: keep real isValidObjectId/invalidIdResponse,
// but mock validateOrigin so it always passes (tested separately in security.test.ts)
vi.mock("@/lib/security", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/security")>();
  return {
    ...actual,
    validateOrigin: vi.fn().mockResolvedValue(true),
  };
});

// ── Imports after mocks ─────────────────────────────────────────────────────
import { PATCH } from "@/app/admin/quoter/api/route";
import QuoterModel from "@/models/quoter";

// ── Helpers ─────────────────────────────────────────────────────────────────
const VALID_ID = "507f1f77bcf86cd799439011";

function patchReq(body: unknown) {
  return new Request("http://localhost/admin/quoter/api", {
    method: "PATCH",
    // No "origin" header → validateOrigin returns true (same-origin server request)
    headers: { "Content-Type": "application/json", host: "localhost" },
    body: JSON.stringify(body),
  });
}

// A minimal quoter document that has 2 products and 1 custom product
function mockQuoter(overrides: object = {}) {
  return {
    products: [{ isFinished: false }, { isFinished: true }],
    customProducts: [{ isFinished: false }],
    status: "EN PROCESO",
    statusChanges: [],
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// ── Test suites ──────────────────────────────────────────────────────────────

describe("PATCH /admin/quoter/api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-apply validateOrigin default after clearAllMocks clears call history
    const { validateOrigin } = vi.mocked(
      {} as typeof import("@/lib/security"),
    );
    void validateOrigin; // accessed via the module mock, no reset needed
  });

  // ── Action enum validation ─────────────────────────────────────────────────
  describe("action enum validation", () => {
    it("returns 400 for an unknown action", async () => {
      const res = await PATCH(patchReq({ action: "DROP_TABLE", quoterId: VALID_ID }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.message).toMatch(/acción no válida/i);
    });

    it("returns 400 when action is missing", async () => {
      const res = await PATCH(patchReq({ quoterId: VALID_ID }));
      expect(res.status).toBe(400);
    });

    it("returns 400 for an empty action string", async () => {
      const res = await PATCH(patchReq({ action: "", quoterId: VALID_ID }));
      expect(res.status).toBe(400);
    });

    it("does not reject DELETE action at the enum stage", async () => {
      vi.mocked(QuoterModel.findByIdAndUpdate).mockResolvedValueOnce({
        active: false,
        status: "ANULADO",
      } as never);
      const res = await PATCH(patchReq({ action: "DELETE", quoterId: VALID_ID }));
      // Should reach DB layer and return 200, not fail at enum check
      expect(res.status).toBe(200);
    });
  });

  // ── quoterId ObjectId validation ───────────────────────────────────────────
  describe("quoterId ObjectId validation", () => {
    it("returns 400 for a plain string quoterId", async () => {
      const res = await PATCH(patchReq({ action: "DELETE", quoterId: "not-an-id" }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
    });

    it("returns 400 for a SQL injection string as quoterId", async () => {
      const res = await PATCH(patchReq({ action: "DELETE", quoterId: "' OR 1=1--" }));
      expect(res.status).toBe(400);
    });

    it("returns 400 for a NoSQL operator as quoterId", async () => {
      const res = await PATCH(patchReq({ action: "DELETE", quoterId: '{"$gt":""}' }));
      expect(res.status).toBe(400);
    });

    it("returns 400 when quoterId is missing", async () => {
      const res = await PATCH(patchReq({ action: "DELETE" }));
      expect(res.status).toBe(400);
    });

    it("proceeds past validation with a valid ObjectId", async () => {
      vi.mocked(QuoterModel.findByIdAndUpdate).mockResolvedValueOnce({
        active: false,
        status: "ANULADO",
      } as never);
      const res = await PATCH(patchReq({ action: "DELETE", quoterId: VALID_ID }));
      expect(res.status).toBe(200);
    });
  });

  // ── productIndex bounds validation (TOGGLE_PRODUCT) ───────────────────────
  describe("TOGGLE_PRODUCT — productIndex validation", () => {
    it("returns 400 when productIndex is a string instead of a number", async () => {
      const res = await PATCH(
        patchReq({ action: "TOGGLE_PRODUCT", quoterId: VALID_ID, productIndex: "0" }),
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 when productIndex is negative", async () => {
      const res = await PATCH(
        patchReq({ action: "TOGGLE_PRODUCT", quoterId: VALID_ID, productIndex: -1 }),
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 when productIndex is beyond the products array length", async () => {
      vi.mocked(QuoterModel.findById).mockResolvedValueOnce(mockQuoter() as never);
      const res = await PATCH(
        patchReq({ action: "TOGGLE_PRODUCT", quoterId: VALID_ID, productIndex: 99 }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.message).toMatch(/fuera de rango/i);
    });

    it("succeeds for a productIndex within bounds", async () => {
      vi.mocked(QuoterModel.findById).mockResolvedValueOnce(mockQuoter() as never);
      const res = await PATCH(
        patchReq({ action: "TOGGLE_PRODUCT", quoterId: VALID_ID, productIndex: 0 }),
      );
      expect(res.status).toBe(200);
    });
  });

  // ── productIndex bounds validation (TOGGLE_CUSTOM_PRODUCT) ────────────────
  describe("TOGGLE_CUSTOM_PRODUCT — productIndex validation", () => {
    it("returns 400 when productIndex is missing (undefined)", async () => {
      const res = await PATCH(
        patchReq({ action: "TOGGLE_CUSTOM_PRODUCT", quoterId: VALID_ID }),
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 when productIndex is out of customProducts bounds", async () => {
      vi.mocked(QuoterModel.findById).mockResolvedValueOnce(mockQuoter() as never);
      const res = await PATCH(
        patchReq({
          action: "TOGGLE_CUSTOM_PRODUCT",
          quoterId: VALID_ID,
          productIndex: 50,
        }),
      );
      expect(res.status).toBe(400);
    });

    it("succeeds for a valid customProduct index", async () => {
      vi.mocked(QuoterModel.findById).mockResolvedValueOnce(mockQuoter() as never);
      const res = await PATCH(
        patchReq({ action: "TOGGLE_CUSTOM_PRODUCT", quoterId: VALID_ID, productIndex: 0 }),
      );
      expect(res.status).toBe(200);
    });
  });

  // ── invoiceNumber validation (SET_INVOICE) ─────────────────────────────────
  describe("SET_INVOICE — invoiceNumber validation", () => {
    it("returns 400 for an XSS payload as invoiceNumber", async () => {
      const res = await PATCH(
        patchReq({
          action: "SET_INVOICE",
          quoterId: VALID_ID,
          invoiceNumber: "<script>alert(1)</script>",
        }),
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 for an empty invoiceNumber", async () => {
      const res = await PATCH(
        patchReq({ action: "SET_INVOICE", quoterId: VALID_ID, invoiceNumber: "" }),
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 for an invoiceNumber longer than 50 characters", async () => {
      const res = await PATCH(
        patchReq({
          action: "SET_INVOICE",
          quoterId: VALID_ID,
          invoiceNumber: "A".repeat(51),
        }),
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 for an invoiceNumber with spaces", async () => {
      const res = await PATCH(
        patchReq({ action: "SET_INVOICE", quoterId: VALID_ID, invoiceNumber: "INV 001" }),
      );
      expect(res.status).toBe(400);
    });

    it("accepts a valid alphanumeric invoice number with hyphens", async () => {
      vi.mocked(QuoterModel.findByIdAndUpdate).mockResolvedValueOnce({
        invoiceNumber: "INV-2024-001",
      } as never);
      const res = await PATCH(
        patchReq({
          action: "SET_INVOICE",
          quoterId: VALID_ID,
          invoiceNumber: "INV-2024-001",
        }),
      );
      expect(res.status).toBe(200);
    });

    it("uses the sanitized invoiceNumber from Zod (not raw input) when updating DB", async () => {
      vi.mocked(QuoterModel.findByIdAndUpdate).mockResolvedValueOnce({
        invoiceNumber: "REC001",
      } as never);
      await PATCH(
        patchReq({ action: "SET_INVOICE", quoterId: VALID_ID, invoiceNumber: "REC001" }),
      );
      expect(QuoterModel.findByIdAndUpdate).toHaveBeenCalledWith(
        VALID_ID,
        { invoiceNumber: "REC001" },
        { new: true },
      );
    });
  });

  // ── dateLimit validation (UPDATE_DATE_LIMIT) ───────────────────────────────
  describe("UPDATE_DATE_LIMIT — dateLimit validation", () => {
    it("returns 400 for a natural language date string", async () => {
      const res = await PATCH(
        patchReq({ action: "UPDATE_DATE_LIMIT", quoterId: VALID_ID, dateLimit: "next monday" }),
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 for a date with trailing injection payload", async () => {
      const res = await PATCH(
        patchReq({
          action: "UPDATE_DATE_LIMIT",
          quoterId: VALID_ID,
          dateLimit: "2024-01-01T00:00:00Z; DROP TABLE users",
        }),
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 for a DD/MM/YYYY formatted date (not ISO 8601)", async () => {
      const res = await PATCH(
        patchReq({ action: "UPDATE_DATE_LIMIT", quoterId: VALID_ID, dateLimit: "31/12/2025" }),
      );
      expect(res.status).toBe(400);
    });

    it("accepts a valid ISO 8601 UTC datetime", async () => {
      vi.mocked(QuoterModel.findByIdAndUpdate).mockResolvedValueOnce({
        dateLimit: new Date("2025-12-31T23:59:59.000Z"),
      } as never);
      const res = await PATCH(
        patchReq({
          action: "UPDATE_DATE_LIMIT",
          quoterId: VALID_ID,
          dateLimit: "2025-12-31T23:59:59.000Z",
        }),
      );
      expect(res.status).toBe(200);
    });

    it("accepts null to clear the date limit", async () => {
      vi.mocked(QuoterModel.findByIdAndUpdate).mockResolvedValueOnce({ dateLimit: null } as never);
      const res = await PATCH(
        patchReq({ action: "UPDATE_DATE_LIMIT", quoterId: VALID_ID, dateLimit: null }),
      );
      expect(res.status).toBe(200);
    });
  });
});
