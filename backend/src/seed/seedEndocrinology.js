import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { seedEndocrinology15OsceStations } from "./endocrinology15Osce.seed.js";

try {
  await connectDatabase();
  const stations = await seedEndocrinology15OsceStations();
  for (const station of stations) console.log(`Seeded Endocrinology OSCE station: ${station.title}`);
  console.log(`Seeded ${stations.length} Endocrinology OSCE stations.`);
} finally {
  await disconnectDatabase();
}
