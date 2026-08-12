import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";

await connectDatabase();

const app = createApp();
app.listen(env.port, () => {
  console.log(`PHMS backend listening on http://localhost:${env.port}`);
});
