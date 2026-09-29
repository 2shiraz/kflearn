import { OsceStation } from "../models/OsceStation.js";
import { OsceAttempt } from "../models/OsceAttempt.js";

export async function getDashboardSummary(req, res) {
  const [stationCount, attemptCount] = await Promise.all([
    OsceStation.countDocuments({ status: "published" }),
    OsceAttempt.countDocuments({ userId: req.user.id }),
  ]);
  res.json({
    success: true,
    data: {
      modules: {
        stations: stationCount,
        clinicalExam: 0,
        handouts: 0,
      },
      attempts: attemptCount,
    },
  });
}
