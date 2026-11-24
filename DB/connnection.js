
import mongoose from "mongoose";

let isConnecting = false;

const db_connection = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (isConnecting) return;

  const isTestEnv = process.env.NODE_ENV === "test";
  const uri = isTestEnv
    ? (process.env.DB_TEST || "mongodb://127.0.0.1:27017/reciplore_test")
    : (process.env.CONNECTION_URL_DEPLOY || 
       process.env.CONNECTION_URL_LOCAL || 
       process.env.DATABASE_URL || 
       process.env.MONGODB_URI || 
       "mongodb://127.0.0.1:27017/reciplore");

  try {
    isConnecting = true;
    const conn = await mongoose.connect(uri, {
      maxPoolSize: 25,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB connected successfully to ${conn.connection.host || "database"}`);
    isConnecting = false;
    return conn;
  } catch (err) {
    isConnecting = false;
    console.error(`MongoDB connection failed: ${err.message}`);
    // Do not crash process, allow graceful handling
  }
};

export default db_connection;
export { db_connection };


