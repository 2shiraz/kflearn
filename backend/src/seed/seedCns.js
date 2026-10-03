import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { seedCns15OsceStations } from "./cns15Osce.seed.js";

try {
  await connectDatabase();
  const stations = await seedCns15OsceStations();
  for (const station of stations) console.log(`Seeded CNS OSCE station: ${station.title}`);
  console.log(`Seeded ${stations.length} CNS OSCE stations.`);
} finally {
  await disconnectDatabase();
}
