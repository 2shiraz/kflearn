import { OsceAttempt } from "../models/OsceAttempt.js";
import { publishedStationList } from "../services/stationCache.service.js";

export async function getDashboardSummary(req, res) {
  const [stations, attemptCount] = await Promise.all([
    publishedStationList(),
    OsceAttempt.countDocuments({ userId: req.user.id }),
  ]);
  res.json({
    success: true,
    data: {
      modules: {
        stations: stations.length,
        clinicalExam: 0,
        handouts: 0,
      },
      attempts: attemptCount,
    },
  });
}
