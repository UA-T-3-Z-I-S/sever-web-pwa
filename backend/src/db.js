import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

let db;

export async function connectDB() {
  if (!db) {
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    db = client.db(process.env.MONGO_DB_NAME);
    console.log("✅ MongoDB conectado");
  }
  return db;
}

export default connectDB;
