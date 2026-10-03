import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { categorizeOsceStations } from "../services/osceCategories.service.js";
import { OSCE_CATEGORIES, stationCategory } from "../utils/osceCategories.js";

try {
  await connectDatabase();
  const { stations, updated } = await categorizeOsceStations();
  console.log(`Categorized ${updated} stations; content, practice modes and existing categories preserved.`);
  for (const category of OSCE_CATEGORIES) {
    console.log(`${category.label}: ${stations.filter((station) => stationCategory(station) === category.value).length}`);
  }
} catch (error) {
  console.error(`Categorization failed (${error.name}). Check database access and configuration.`);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}
