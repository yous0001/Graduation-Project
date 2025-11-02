import { describe, it, expect, beforeAll } from "bun:test";
import { ensureServer, getBaseURL } from "./setupServer.js";

beforeAll(async () => {
  await ensureServer();
});

describe("E2E: basic app endpoints", () => {
  it("GET /unknown returns 404 with JSON error", async () => {
    const res = await fetch(`${getBaseURL()}/unknown-endpoint`);
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json).toMatchObject({ success: false, message: "API endpoint not found" });
  });
});