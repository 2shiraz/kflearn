import { AdminAuditLog } from "../models/AdminAuditLog.js";
import { CreditTransaction } from "../models/CreditTransaction.js";
import { OsceAttempt } from "../models/OsceAttempt.js";
import { OsceStation } from "../models/OsceStation.js";
import { User } from "../models/User.js";

const DAY = 24 * 60 * 60 * 1000;
const RANGES = [7, 30, 90];

// Daily counts keyed by "YYYY-MM-DD" (UTC), filled with zeros for empty days.
function series(rows, days, start) {
  const map = new Map(rows.map((r) => [r._id, r.count]));
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(start.getTime() + i * DAY).toISOString().slice(0, 10);
    return { date, count: map.get(date) || 0 };
  });
}

const byDay = (field) => ({ $dateToString: { format: "%Y-%m-%d", date: `$${field}` } });

// Numbers and daily series for the admin overview charts.
export async function getAdminStats(req, res) {
  const days = RANGES.includes(Number(req.query.days)) ? Number(req.query.days) : 30;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const start = new Date(today.getTime() - (days - 1) * DAY);
  const now = Date.now();

  const [
    totalUsers, newUsers, active1, active7, active30, suspended,
    signupRows, practiceRows, studentRows, attemptsInRange, aiInRange,
    creditRows, topStations, publishedStations,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: start } }),
    User.countDocuments({ lastActiveAt: { $gte: new Date(now - DAY) } }),
    User.countDocuments({ lastActiveAt: { $gte: new Date(now - 7 * DAY) } }),
    User.countDocuments({ lastActiveAt: { $gte: new Date(now - 30 * DAY) } }),
    User.countDocuments({ suspended: true }),
    User.aggregate([{ $match: { createdAt: { $gte: start } } }, { $group: { _id: byDay("createdAt"), count: { $sum: 1 } } }]),
    OsceAttempt.aggregate([{ $match: { createdAt: { $gte: start } } }, { $group: { _id: byDay("createdAt"), count: { $sum: 1 } } }]),
    OsceAttempt.aggregate([
      { $match: { createdAt: { $gte: start } } },
      { $group: { _id: { day: byDay("createdAt"), user: "$userId" } } },
      { $group: { _id: "$_id.day", count: { $sum: 1 } } },
    ]),
    OsceAttempt.countDocuments({ createdAt: { $gte: start } }),
    OsceAttempt.countDocuments({ createdAt: { $gte: start }, mode: "virtual-patient" }),
    CreditTransaction.aggregate([
      { $match: { createdAt: { $gte: start } } },
      { $group: { _id: "$type", total: { $sum: "$amount" } } },
    ]),
    OsceAttempt.aggregate([
      { $match: { createdAt: { $gte: start } } },
      { $group: { _id: "$stationId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: "oscestations", localField: "_id", foreignField: "_id", as: "station" } },
    ]),
    OsceStation.countDocuments({ status: "published" }),
  ]);

  const credit = Object.fromEntries(creditRows.map((r) => [r._id, r.total]));
  res.json({
    success: true,
    data: {
      days,
      users: { total: totalUsers, new: newUsers, active24h: active1, active7d: active7, active30d: active30, suspended },
      practice: { attempts: attemptsInRange, aiSessions: aiInRange, publishedStations },
      credits: { spent: Math.abs(credit.spend || 0) - (credit.refund || 0), granted: (credit.grant || 0) },
      series: {
        signups: series(signupRows, days, start),
        attempts: series(practiceRows, days, start),
        activeStudents: series(studentRows, days, start),
      },
      topStations: topStations.map((row) => ({ id: row._id, title: row.station[0]?.title || "Removed station", count: row.count })),
    },
  });
}

export async function getAdminActivity(req, res) {
  const rows = await AdminAuditLog.find().sort({ createdAt: -1 }).limit(50).lean();
  res.json({
    success: true,
    data: rows.map((r) => ({ id: r._id, actorEmail: r.actorEmail, action: r.action, fields: r.fields, createdAt: r.createdAt })),
  });
}
