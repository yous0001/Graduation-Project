import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { ensureServer, getBaseURL } from "./setupServer.js";
import User from "../../DB/models/user.model.js";
import { deleteUserByEmail } from "./utils/db.js";

const uniqueEmail = `reciplore0@gmail.com`;
const password = "Passw0rd!234";

let refreshToken;

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  await ensureServer();
});

afterAll(async () => {
  await deleteUserByEmail(uniqueEmail);
});

describe("E2E: Auth mutation flow", () => {
  it("POST /auth/register creates a user (emails mocked)", async () => {
    const res = await fetch(`${getBaseURL()}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: uniqueEmail,
        password,
        confirmPassword: password,
        phoneNumbers: ["01234567890"],
      }),
    });
    expect(res.status).toBe(201);
  });

  it("Login, verify code and get tokens", async () => {
    // mark email verified to allow login
    await User.updateOne(
      { email: uniqueEmail },
      { $set: { isEmailVerified: true } }
    );

    const loginRes = await fetch(`${getBaseURL()}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: uniqueEmail, password }),
    });
    expect(loginRes.status).toBe(200);

    const user = await User.findOne({ email: uniqueEmail });
    expect(user?.verificationCode).toBeTruthy();

    const verifyRes = await fetch(`${getBaseURL()}/auth/verify-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: user.verificationCode }),
    });
    expect(verifyRes.status).toBe(200);
    const verifyJson = await verifyRes.json();
    expect(verifyJson.accessToken).toBeTruthy();
    expect(verifyJson.refreshToken).toBeTruthy();

    refreshToken = verifyJson.refreshToken;
  });

  it("GET /auth/refresh-token returns new tokens", async () => {
    const res = await fetch(`${getBaseURL()}/auth/refresh-token`, {
      headers: { refreshtoken: refreshToken },
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.accessToken).toBeTruthy();
    expect(json.refreshToken).toBeTruthy();
  });
});
