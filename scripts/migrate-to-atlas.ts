/**
 * One-off migration: copies every collection from the local MongoDB
 * instance into the new Atlas cluster. Run once when cutting the app over
 * from local dev Mongo to Atlas — not part of the normal seed pipeline.
 * Uses the native driver (not Mongoose) so documents are copied byte-for-byte
 * (ObjectIds, Dates, embedded docs) with no schema casting in between.
 */
import { MongoClient } from "mongodb";

const LOCAL_URI = "mongodb://127.0.0.1:27017/ambika-jewellers";
const ATLAS_URI = process.env.MONGODB_URI;

async function main() {
  if (!ATLAS_URI || !ATLAS_URI.startsWith("mongodb+srv://")) {
    throw new Error(
      "MONGODB_URI env var must be set to the Atlas connection string before running this script.",
    );
  }

  const localClient = new MongoClient(LOCAL_URI);
  const atlasClient = new MongoClient(ATLAS_URI);

  await localClient.connect();
  await atlasClient.connect();

  const localDb = localClient.db();
  const atlasDb = atlasClient.db();

  const collections = await localDb.listCollections().toArray();
  console.log(`Found ${collections.length} collections in local DB.`);

  for (const { name } of collections) {
    const localCol = localDb.collection(name);
    const atlasCol = atlasDb.collection(name);

    const docs = await localCol.find({}).toArray();
    if (docs.length > 0) {
      await atlasCol.insertMany(docs, { ordered: false });
    }

    const indexes = await localCol.indexes();
    for (const index of indexes) {
      if (index.name === "_id_") continue;
      const { key, name: indexName, ...options } = index;
      try {
        await atlasCol.createIndex(key, { name: indexName, ...options });
      } catch (err) {
        console.warn(
          `  index ${indexName} on ${name} failed:`,
          (err as Error).message,
        );
      }
    }

    const atlasCount = await atlasCol.countDocuments();
    console.log(
      `  ${name}: ${docs.length} docs copied, ${indexes.length - 1} indexes, verified count=${atlasCount}`,
    );
  }

  await localClient.close();
  await atlasClient.close();
  console.log("Migration complete.");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
