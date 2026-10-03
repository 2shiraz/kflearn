import { OsceStation } from "../models/OsceStation.js";
import { stationCategory } from "../utils/osceCategories.js";

export async function categorizeOsceStations() {
  const stations = await OsceStation.find().lean();
  let updated = 0;
  for (const station of stations) {
    if (station.category) continue;
    const result = await OsceStation.updateOne(
      { _id: station._id, $or: [{ category: "" }, { category: { $exists: false } }] },
      { $set: { category: stationCategory(station) } },
      { timestamps: false },
    );
    updated += result.modifiedCount;
  }
  return { updated, stations };
}
