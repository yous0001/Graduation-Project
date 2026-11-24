import mongoose from "mongoose";

let cachedPromise = null;
let lastDbError = null;

export const getLastDbError = () => lastDbError;

const connectWithOptions = async (uri) => {
  return mongoose.connect(uri, {
    maxPoolSize: 5,
    minPoolSize: 0,
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 8000,
    socketTimeoutMS: 20000,
  });
};

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

  cachedPromise = (async () => {
    try {
      const conn = await connectWithOptions(uri);
      lastDbError = null;
      console.log(`MongoDB connected successfully to ${conn.connection.host || "database"}`);
      return conn;
    } catch (firstErr) {
      // One quick retry for transient Atlas serverless handshake blips
      try {
        await new Promise((r) => setTimeout(r, 300));
        const conn = await connectWithOptions(uri);
        lastDbError = null;
        return conn;
      } catch (err) {
        cachedPromise = null;
        lastDbError = hasEnvUri
          ? err.message
          : `No MongoDB env var configured (CONNECTION_URL_DEPLOY / MONGODB_URI). ${firstErr.message}`;
        console.error(`MongoDB connection failed: ${lastDbError}`);
        return null;
      }
    }
  })();

  return cachedPromise;
};

export default db_connection;
export { db_connection };
