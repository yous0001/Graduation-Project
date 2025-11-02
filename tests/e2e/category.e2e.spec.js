import { describe, it, expect, beforeAll } from "bun:test";
import { ensureServer, getBaseURL } from "./setupServer.js";

beforeAll(async () => {
  await ensureServer();
});

describe("E2E: Category", () => {
  it("GET /category returns 200 and categories array", async () => {
    const res = await fetch(`${getBaseURL()}/category`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.categories)).toBe(true);
  });
});