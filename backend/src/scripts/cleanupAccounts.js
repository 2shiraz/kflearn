// Deletes every account that isn't an admin or contributor, and everything
// linked to it. A dry run unless --apply is given.
//
//   node src/scripts/cleanupAccounts.js --db kflearn-backup            (dry run)
//   node src/scripts/cleanupAccounts.js --db kflearn-backup --apply    (deletes)
//
// The production database also needs --production.
import mongoose from "mongoose";
import { env } from "../config/env.js";

const args = process.argv.slice(2);
const dbIndex = args.indexOf("--db");
const dbName = dbIndex >= 0 ? args[dbIndex + 1] : "";
const apply = args.includes("--apply");
if (!dbName) {
  console.error("Name the database: --db <name>");
  process.exit(1);
}
if (dbName === "kflearn" && apply && !args.includes("--production")) {
  console.error('"kflearn" is the production database. Add --production to delete there.');
  process.exit(1);
}

await mongoose.connect(env.mongodbUri, { dbName });
const db = mongoose.connection.db;
try {
  const existing = new Set((await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name));
  const keepRoles = ["admin", "contributor"];
  const doomed = await db.collection("users").find({ role: { $nin: keepRoles } }, { projection: { _id: 1, email: 1 } }).toArray();
  const kept = await db.collection("users").countDocuments({ role: { $in: keepRoles } });
  const ids = doomed.map((u) => u._id);
  const idStrings = ids.map(String);

  const plan = [
    ["users", { _id: { $in: ids } }],
    ["osceattempts", { userId: { $in: [...idStrings, ...ids] } }],
    ["credittransactions", { userId: { $in: ids } }],
    ["payments", { userId: { $in: ids } }],
    ["adminauditlogs", { target: { $in: idStrings } }],
    ["sessions", { userId: { $in: ids } }],
    ["accessperiods", { userId: { $in: ids } }],
    ["unansweredquestions", {}],
  ].filter(([name]) => existing.has(name));

  console.log(`Database "${dbName}": keeping ${kept} admin/contributor accounts, removing ${doomed.length} others.`);
  for (const [name, filter] of plan) {
    const count = await db.collection(name).countDocuments(filter);
    if (apply) {
      const { deletedCount } = await db.collection(name).deleteMany(filter);
      console.log(`  ${name}: deleted ${deletedCount}`);
    } else {
      console.log(`  ${name}: would delete ${count}`);
    }
  }
  if (!apply) console.log("Dry run. Nothing was deleted. Add --apply to delete.");
} finally {
  await mongoose.disconnect();
}
