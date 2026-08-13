import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { authenticate } from "./middleware/auth.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.routes.js";
import historyRoutes from "./routes/history.routes.js";
import attemptRoutes from "./routes/historyAttempt.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import adminHistoryRoutes from "./routes/adminHistory.routes.js";
import adminUserRoutes from "./routes/adminUser.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.frontendUrl, credentials: true }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (req, res) => {
    res.json({ success: true, data: { status: "ok" } });
  });
  app.use("/api/auth", authRoutes);
  app.use(authenticate);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/history/attempts", attemptRoutes);
  app.use("/api/history", historyRoutes);
  app.use("/api/ai", aiRoutes);
  app.use("/api/admin/history", adminHistoryRoutes);
  app.use("/api/admin/users", adminUserRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
