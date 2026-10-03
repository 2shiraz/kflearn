import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { seedRheumatology10OsceStations } from "./rheumatology10Osce.seed.js";

try {
  await connectDatabase();
  const stations = await seedRheumatology10OsceStations();
  for (const station of stations) console.log(`Seeded Rheumatology OSCE station: ${station.title}`);
  console.log(`Seeded ${stations.length} Rheumatology OSCE stations.`);
} finally {
  await disconnectDatabase();
}
