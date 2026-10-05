import { AccessPeriod } from "../models/AccessPeriod.js";
import { User } from "../models/User.js";
import { sendEmail } from "./email/index.js";
import { accessEndedEmail, accessEndingEmail } from "./email/templates.js";
import { getBranding, getPricing } from "./siteSettings.service.js";

const DAY = 24 * 60 * 60 * 1000;
const ENDING_WINDOW = 5 * DAY;

// Emails students whose pass ends within 5 days, and again when it has ended
// (during the grace days). Each reminder is marked on the period that ends
// last, so running this again (or after a restart) never sends it twice.
export async function sendAccessReminders(now = new Date()) {
  const [{ subscription }, { siteName }] = await Promise.all([getPricing(), getBranding()]);
  const graceMs = subscription.graceDays * DAY;
  const latest = await AccessPeriod.aggregate([
    { $match: { revokedAt: null } },
    { $sort: { to: -1 } },
    { $group: { _id: "$userId", periodId: { $first: "$_id" }, to: { $first: "$to" }, remindedEndingAt: { $first: "$remindedEndingAt" }, remindedEndedAt: { $first: "$remindedEndedAt" } } },
    { $match: { to: { $gt: new Date(now.getTime() - graceMs), $lte: new Date(now.getTime() + ENDING_WINDOW) } } },
  ]);
  let sent = 0;
  for (const row of latest) {
    const ended = row.to <= now;
    if (ended ? row.remindedEndedAt : row.remindedEndingAt) continue;
    const user = await User.findById(row._id).select("email fullName role suspended").lean();
    if (!user || user.suspended || user.role !== "student") continue;
    // Claim first, so two servers running this at once don't both send.
    const field = ended ? "remindedEndedAt" : "remindedEndingAt";
    const claimed = await AccessPeriod.updateOne({ _id: row.periodId, [field]: null }, { $set: { [field]: now } });
    if (!claimed.modifiedCount) continue;
    const email = ended
      ? accessEndedEmail({ name: user.fullName, graceUntil: new Date(row.to.getTime() + graceMs), siteName })
      : accessEndingEmail({ name: user.fullName, until: row.to, siteName });
    if (await sendEmail({ to: user.email, ...email })) sent += 1;
  }
  return sent;
}

// Runs the reminders hourly while the server is up.
export function startReminderSchedule() {
  const run = () => sendAccessReminders().catch((error) => console.error("Reminders failed:", error.message));
  setTimeout(run, 60 * 1000).unref();
  setInterval(run, 60 * 60 * 1000).unref();
}
