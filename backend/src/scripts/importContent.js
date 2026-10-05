// Loads the MCQ banks, OSPE stations, guides and handouts from
// backend/content-source into the database. Replaces what's there.
//
//   node src/scripts/importContent.js --db kflearn-backup
//
// The database must be named on the command line. The production database
// also needs --production, so it is never written to by accident.
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { importContent } from "../content/importContent.js";

const args = process.argv.slice(2);
const dbIndex = args.indexOf("--db");
const dbName = dbIndex >= 0 ? args[dbIndex + 1] : "";
if (!dbName) {
  console.error("Name the database to write to: --db <name>");
  process.exit(1);
}
if (dbName === "kflearn" && !args.includes("--production")) {
  console.error('"kflearn" is the production database. Add --production if you really mean it.');
  process.exit(1);
}

await mongoose.connect(env.mongodbUri, { dbName });
try {
  const result = await importContent();
  console.log(`Imported into "${dbName}": ${result.mcqs} MCQs in ${result.mcqTopics} topics, ${result.ospeStations} OSPE stations, ${result.guidePages} guide pages. Content version ${result.version}.`);
} finally {
  await mongoose.disconnect();
}
