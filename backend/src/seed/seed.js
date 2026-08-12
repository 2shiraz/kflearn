import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { seedHistoryContent } from "./history.seed.js";

await connectDatabase();
const result = await seedHistoryContent();
console.log(`Seeded history module: ${result.module.title}`);
for (const module of result.respiratoryPdfHistoryModules) {
  console.log(`Seeded history module: ${module.title}`);
}
await disconnectDatabase();
