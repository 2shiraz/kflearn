import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { startReminderSchedule } from "./services/reminders.service.js";

await connectDatabase();

const app = createApp();
startReminderSchedule();
app.listen(env.port, env.host, () => {
  console.log(`PHMS backend listening on http://${env.host}:${env.port}`);
});
