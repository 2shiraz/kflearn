import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { seedCvsOsceStations } from "./cvsOsce.seed.js";

try {
  await connectDatabase();
  const stations = await seedCvsOsceStations();
  for (const station of stations) console.log(`Seeded CVS OSCE station: ${station.title}`);
  console.log(`Seeded ${stations.length} CVS OSCE stations.`);
} finally {
  await disconnectDatabase();
}
