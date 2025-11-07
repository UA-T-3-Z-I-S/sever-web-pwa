import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

async function checkReplicaSet() {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();

  const adminDb = client.db().admin(); // Admin DB para comandos de status
  const status = await adminDb.command({ replSetGetStatus: 1 });

  console.log(JSON.stringify(status, null, 2));

  await client.close();
}

checkReplicaSet().catch(console.error);
