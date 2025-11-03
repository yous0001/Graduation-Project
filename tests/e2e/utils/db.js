import mongoose from "mongoose";
import User from "../../../DB/models/user.model.js";
import Address from "../../../DB/models/address.model.js";

export async function deleteUserByEmail(email) {
  if (!email) return;
  await User.deleteMany({ email });
}

export async function clearAddressesForUser(userId) {
  if (!userId) return;
  await Address.deleteMany({ user: userId });
}

export async function dropTestCollections() {
  const connection = mongoose.connection;
  if (!connection?.db) return;
  const collections = await connection.db.collections();
  for (const collection of collections) {
    try {
      await collection.deleteMany({});
    } catch {}
  }
}
