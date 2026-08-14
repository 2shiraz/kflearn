import { HistoryModule } from "../models/HistoryModule.js";
import { HistoryAttempt } from "../models/HistoryAttempt.js";

export async function getDashboardSummary(req, res) {
  const [historyModuleCount, attemptCount] = await Promise.all([
    HistoryModule.countDocuments({ status: "published" }),
    HistoryAttempt.countDocuments({ userId: req.user.id }),
  ]);
  res.json({
    success: true,
    data: {
      modules: {
        history: historyModuleCount,
        clinicalExam: 0,
        handouts: 0,
        stations: 0,
      },
      attempts: attemptCount,
    },
  });
}
