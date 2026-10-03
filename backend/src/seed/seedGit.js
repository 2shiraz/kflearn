import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { seedGit15OsceStations } from "./git15Osce.seed.js";

try {
  await connectDatabase();
  const stations = await seedGit15OsceStations();
  for (const station of stations) console.log(`Seeded GIT OSCE station: ${station.title}`);
  console.log(`Seeded ${stations.length} GIT OSCE stations.`);
} finally {
  await disconnectDatabase();
}
