import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import { env } from "./config/env.js";
import { authenticate } from "./middleware/auth.js";
import { csrfProtection } from "./middleware/csrf.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import authRoutes from "./routes/auth.routes.js";
import historyRoutes from "./routes/history.routes.js";
import attemptRoutes from "./routes/historyAttempt.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import adminHistoryRoutes from "./routes/adminHistory.routes.js";
import adminUserRoutes from "./routes/adminUser.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

export function createApp() {
  const app = express();
  // Set this only to the number of trusted proxy hops in the deployment. Trusting
  // arbitrary X-Forwarded-For values lets clients bypass the IP rate limit.
  if (env.trustedProxyHops > 0) app.set("trust proxy", env.trustedProxyHops);

  app.use(helmet());
  app.use(cors({ origin: env.frontendUrl, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(mongoSanitize()); // strips `$`/`.` keys from body/query/params to block NoSQL operator injection

  app.get("/api/health", (req, res) => {
    res.json({ success: true, data: { status: "ok" } });
  });
  app.use("/api", apiLimiter);
  app.use("/api/auth", authRoutes);
  app.use(authenticate);
  app.use(csrfProtection);
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
