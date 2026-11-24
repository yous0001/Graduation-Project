
import mongoose from "mongoose";

let cachedPromise = null;

const db_connection = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (cachedPromise) {
    return cachedPromise;
  }

  const isTestEnv = process.env.NODE_ENV === "test";
  const uri = isTestEnv
    ? (process.env.DB_TEST || "mongodb://127.0.0.1:27017/reciplore_test")
    : (process.env.CONNECTION_URL_DEPLOY || 
       process.env.CONNECTION_URL_LOCAL || 
       process.env.DATABASE_URL || 
       process.env.MONGODB_URI || 
       "mongodb://127.0.0.1:27017/reciplore");

  cachedPromise = mongoose.connect(uri, {
    maxPoolSize: 25,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
  }).then((conn) => {
    console.log(`MongoDB connected successfully to ${conn.connection.host || "database"}`);
    return conn;
  }).catch((err) => {
    cachedPromise = null;
    console.error(`MongoDB connection failed: ${err.message}`);
    return null;
  });

  return cachedPromise;
};

export default db_connection;
export { db_connection };


