import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { User } from "../models/User.js";

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error("Usage: npm run make-admin -- user@example.com");
  process.exit(1);
}

await connectDatabase();

const user = await User.findOneAndUpdate(
  { email },
  { $set: { role: "admin", roleLabel: "Admin" } },
  { new: true },
);

if (!user) {
  console.error(`No user found for ${email}`);
  await disconnectDatabase();
  process.exit(1);
}

console.log(`Updated ${user.email} to admin.`);
await disconnectDatabase();
