import { describe, it, expect, beforeAll } from "bun:test";
import { ensureServer, getBaseURL } from "./setupServer.js";

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  await ensureServer();
});

describe("E2E: Recipe list", () => {
  it("GET /recipe/list returns recipes (no auth required)", async () => {
    const res = await fetch(`${getBaseURL()}/recipe/list`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.recipes).toBeTruthy();
  });
});
