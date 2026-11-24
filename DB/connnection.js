
import mongoose from "mongoose";

let cachedPromise = null;
let lastDbError = null;

export const getLastDbError = () => lastDbError;

const db_connection = async () => {
  if (mongoose.connection.readyState === 1) {
    lastDbError = null;
    return mongoose.connection;
  }
  if (cachedPromise) {
    return cachedPromise;
  }

  const isTestEnv = process.env.NODE_ENV === "test";
  const hasEnvUri = Boolean(
    process.env.CONNECTION_URL_DEPLOY ||
    process.env.CONNECTION_URL_LOCAL ||
    process.env.DATABASE_URL ||
    process.env.MONGODB_URI
  );
  const uri = isTestEnv
    ? (process.env.DB_TEST || "mongodb://127.0.0.1:27017/reciplore_test")
    : (process.env.CONNECTION_URL_DEPLOY || 
       process.env.CONNECTION_URL_LOCAL || 
       process.env.DATABASE_URL || 
       process.env.MONGODB_URI || 
       "mongodb://127.0.0.1:27017/reciplore");

  cachedPromise = mongoose.connect(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 4000,
  }).then((conn) => {
    lastDbError = null;
    console.log(`MongoDB connected successfully to ${conn.connection.host || "database"}`);
    return conn;
  }).catch((err) => {
    cachedPromise = null;
    lastDbError = hasEnvUri
      ? err.message
      : `No MongoDB env var configured (CONNECTION_URL_DEPLOY / MONGODB_URI). ${err.message}`;
    console.error(`MongoDB connection failed: ${lastDbError}`);
    return null;
  });

  return cachedPromise;
};

export default db_connection;
export { db_connection };


