import { describe, it, expect, beforeAll } from "bun:test";
import { ensureServer, getBaseURL } from "./setupServer.js";

beforeAll(async () => {
  await ensureServer();
});

describe("E2E: Banner", () => {
  it("GET /banner/:section returns 200 with success field", async () => {
    const res = await fetch(`${getBaseURL()}/banner/home`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(json, "banners")).toBe(true);
  });
});