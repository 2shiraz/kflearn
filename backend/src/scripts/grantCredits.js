// Grants credits from the command line — deliberately not exposed over HTTP,
// so there is no API that can mint credits. Every grant is written to the
// CreditTransaction ledger.
//
//   npm run grant-credits -- user@example.com 500 "Optional note"
//   npm run grant-credits -- --admins 9999 "Admin testing balance"
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { MAX_CREDIT_OPERATION } from "../config/credits.js";
import { User } from "../models/User.js";
import { grantCredits } from "../services/credit.service.js";

const [target, rawAmount, note = "Granted via CLI"] = process.argv.slice(2);
const amount = Number(rawAmount);

if (!target || !Number.isSafeInteger(amount) || amount <= 0 || amount > MAX_CREDIT_OPERATION) {
  console.error(`Usage: npm run grant-credits -- <email | --admins> <amount 1-${MAX_CREDIT_OPERATION}> ["note"]`);
  process.exit(1);
}

await connectDatabase();

const users = target === "--admins"
  ? await User.find({ role: "admin" }, { email: 1 }).lean()
  : await User.find({ email: target.trim().toLowerCase() }, { email: 1 }).lean();

if (users.length === 0) {
  console.error(target === "--admins" ? "No admin users found." : `No user found for ${target}`);
  await disconnectDatabase();
  process.exit(1);
}

for (const user of users) {
  const balance = await grantCredits({ userId: user._id, amount, note: note.slice(0, 200), createdBy: "cli" });
  console.log(`Granted ${amount} credits to ${user.email}. New balance: ${balance}.`);
}

await disconnectDatabase();
