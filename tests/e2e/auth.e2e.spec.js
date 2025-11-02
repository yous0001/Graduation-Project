import { describe, it, expect, beforeAll } from "bun:test";
import { ensureServer, getBaseURL } from "./setupServer.js";

beforeAll(async () => {
  await ensureServer();
});

describe("E2E: Auth", () => {
  it("GET /auth/refresh-token without header returns 401", async () => {
    const res = await fetch(`${getBaseURL()}/auth/refresh-token`);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.message).toBe("Please login first");
  });
});