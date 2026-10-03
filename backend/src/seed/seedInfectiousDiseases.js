import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { seedInfectiousDiseases15OsceStations } from "./infectiousDiseases15Osce.seed.js";

try {
  await connectDatabase();
  const stations = await seedInfectiousDiseases15OsceStations();
  for (const station of stations) console.log(`Seeded Infectious Diseases OSCE station: ${station.title}`);
  console.log(`Seeded ${stations.length} Infectious Diseases OSCE stations.`);
} finally {
  await disconnectDatabase();
}
