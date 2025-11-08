
import mongoose from "mongoose";

const db_connection = async () => {
  const isTestEnv = process.env.NODE_ENV === "test";
  const uri = isTestEnv
    ? process.env.DB_TEST
    : process.env.CONNECTION_URL_DEPLOY || process.env.CONNECTION_URL_LOCAL;

  await mongoose
    .connect(uri)
    .then(() => console.log(`db connected successfully`))
    .catch((err) => console.log(`db connection failed`, err));
};

export default db_connection;

