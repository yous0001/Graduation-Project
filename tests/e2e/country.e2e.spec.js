import { describe, it, expect, beforeAll } from "bun:test";
import { ensureServer, getBaseURL } from "./setupServer.js";

beforeAll(async () => {
  await ensureServer();
});

describe("E2E: Country", () => {
  it("GET /country returns 200 and countries array", async () => {
    const res = await fetch(`${getBaseURL()}/country`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.countries)).toBe(true);
  });
});