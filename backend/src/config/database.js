import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDatabase(uri = env.mongodbUri, { allowLegacy = false } = {}) {
  mongoose.set("strictQuery", true);
  if (!allowLegacy) {
    // Check through an unmodelled connection first. Connecting registered
    // Mongoose models could otherwise auto-create the new collections before
    // the preflight, making a legacy database look like a name conflict.
    const probe = mongoose.createConnection(uri, { autoCreate: false, autoIndex: false });
    let legacy;
    try {
      await probe.asPromise();
      const collections = await probe.db.listCollections({}, { nameOnly: true }).toArray();
      const legacyNames = new Set(["historymodules", "historyattempts", "historyguides"]);
      legacy = collections.filter(({ name }) => legacyNames.has(name));
    } finally {
      await probe.close();
    }
    if (legacy.length) {
      throw new Error("Legacy OSCE collections found. Back up this database, then run npm run migrate:osce-names -- --apply before starting the updated app.");
    }
  }
  await mongoose.connect(uri);
  return mongoose.connection;
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
