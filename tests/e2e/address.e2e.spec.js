import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { ensureServer, getBaseURL } from "./setupServer.js";
import User from "../../DB/models/user.model.js";
import { deleteUserByEmail, clearAddressesForUser } from "./utils/db.js";

const uniqueEmail = `addruser_${Date.now()}@example.com`;
const password = "Passw0rd!234";

let accessToken;
let userId;

function withBearer(token) {
  return `${process.env.TOKEN_PREFIX || "accessToken_"}${token}`;
}

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  await ensureServer();

  // register
  await fetch(`${getBaseURL()}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Addr User",
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
  const loginRes = await fetch(`${getBaseURL()}/auth/login`, {
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
  userId = verifyJson._id || user._id?.toString();
});

afterAll(async () => {
  await clearAddressesForUser(userId);
  await deleteUserByEmail(uniqueEmail);
});

describe("E2E: Address CRUD", () => {
  let addressId;

  it("POST /address/add creates address", async () => {
    const res = await fetch(`${getBaseURL()}/address/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accesstoken: withBearer(accessToken),
      },
      body: JSON.stringify({
        country: "EG",
        city: "Cairo",
        postalCode: 12345,
        buildingNumber: "10",
        floorNumber: 5,
        streetName: "Tahrir",
        addressLabel: "Home",
        notes: "Near square",
      }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.address?._id).toBeTruthy();
    addressId = json.address._id;
  });

  it("GET /address returns addresses", async () => {
    const res = await fetch(`${getBaseURL()}/address`, {
      headers: { accesstoken: withBearer(accessToken) },
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.addresses)).toBe(true);
    expect(json.addresses.length).toBeGreaterThan(0);
  });

  it("PUT /address/:id updates address", async () => {
    const res = await fetch(`${getBaseURL()}/address/${addressId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        accesstoken: withBearer(accessToken),
      },
      body: JSON.stringify({ streetName: "Updated Street" }),
    });
    expect(res.status).toBe(200);
  });

  it("PATCH /address/set-default/:id marks default", async () => {
    const res = await fetch(
      `${getBaseURL()}/address/set-default/${addressId}`,
      {
        method: "PATCH",
        headers: { accesstoken: withBearer(accessToken) },
      }
    );
    expect(res.status).toBe(200);
  });

  it("GET /address/get-default returns default", async () => {
    const res = await fetch(`${getBaseURL()}/address/get-default`, {
      headers: { accesstoken: withBearer(accessToken) },
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.defaultAddress?._id).toBe(addressId);
  });

  it("DELETE /address/:id deletes address", async () => {
    const res = await fetch(`${getBaseURL()}/address/${addressId}`, {
      method: "DELETE",
      headers: { accesstoken: withBearer(accessToken) },
    });
    expect(res.status).toBe(200);
  });
});
