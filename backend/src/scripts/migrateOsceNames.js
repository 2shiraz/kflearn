import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { migrateOsceNames } from "../migrations/osceNames.js";

const apply = process.argv.includes("--apply");
await connectDatabase(undefined, { allowLegacy: true });
try {
  const actions = await migrateOsceNames(mongoose.connection.db, { apply });
  if (!actions.length) console.log("OSCE database names are already current; nothing to change.");
  else {
    console.log(actions.join("\n"));
    if (!apply) console.log("Dry run only. Back up the database, stop application writes, then rerun with --apply.");
  }
} finally {
  await disconnectDatabase();
}
