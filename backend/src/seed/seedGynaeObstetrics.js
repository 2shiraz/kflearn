import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { seedGynaeObstetrics15OsceStations } from "./gynaeObstetrics15Osce.seed.js";

try {
  await connectDatabase();
  const stations = await seedGynaeObstetrics15OsceStations();
  for (const station of stations) console.log(`Seeded Gynaecology/Obstetrics OSCE station: ${station.title}`);
  console.log(`Seeded ${stations.length} Gynaecology/Obstetrics OSCE stations.`);
} finally {
  await disconnectDatabase();
}
