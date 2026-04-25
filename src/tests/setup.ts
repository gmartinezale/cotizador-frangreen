import { vi } from "vitest";

// Prevent "server-only" from throwing outside Next.js runtime
vi.mock("server-only", () => ({}));
