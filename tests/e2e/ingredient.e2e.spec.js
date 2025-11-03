import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { ensureServer, getBaseURL } from "./setupServer.js";
import User from "../../DB/models/user.model.js";
import { deleteUserByEmail } from "./utils/db.js";

const uniqueEmail = `inguser_${Date.now()}@example.com`;
const password = "Passw0rd!234";

let accessToken;

function withBearer(token) {
  return `${process.env.TOKEN_PREFIX || "accessToken_"}${token}`;
}

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  await ensureServer();

  await fetch(`${getBaseURL()}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Ing User",
      email: uniqueEmail,
      password,
      confirmPassword: password,
      phoneNumbers: ["01234567890"],
    }),
  });
  await User.updateOne(
    { email: uniqueEmail },
    { $set: { isEmailVerified: true } }
  );
  await fetch(`${getBaseURL()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: uniqueEmail, password }),
  });
  const user = await User.findOne({ email: uniqueEmail });
  const verifyRes = await fetch(`${getBaseURL()}/auth/verify-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: user.verificationCode }),
  });
  const verifyJson = await verifyRes.json();
  accessToken = verifyJson.accessToken;
});

afterAll(async () => {
  await deleteUserByEmail(uniqueEmail);
});

describe("E2E: Ingredient list", () => {
  it("GET /ingredient/list returns ingredients (authed)", async () => {
    const res = await fetch(`${getBaseURL()}/ingredient/list`, {
      headers: { accesstoken: withBearer(accessToken) },
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.ingredients).toBeTruthy();
  });
});
