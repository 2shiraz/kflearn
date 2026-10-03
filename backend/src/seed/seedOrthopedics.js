import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { seedOrthopedics15OsceStations } from "./orthopedics15Osce.seed.js";

try {
  await connectDatabase();
  const stations = await seedOrthopedics15OsceStations();
  for (const station of stations) console.log(`Seeded Orthopedics OSCE station: ${station.title}`);
  console.log(`Seeded ${stations.length} Orthopedics OSCE stations.`);
} finally {
  await disconnectDatabase();
}
