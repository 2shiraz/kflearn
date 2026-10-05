import compression from "compression";
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
import osceRoutes from "./routes/osce.routes.js";
import osceAttemptRoutes from "./routes/osceAttempt.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import adminOsceRoutes from "./routes/adminOsce.routes.js";
import adminUserRoutes from "./routes/adminUser.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import creditRoutes from "./routes/credit.routes.js";
import siteRoutes from "./routes/site.routes.js";
import contentRoutes from "./routes/content.routes.js";
import { requireAccess, requireAccessOrUnfinishedAttempt } from "./middleware/requireAccess.js";
import adminSettingsRoutes from "./routes/adminSettings.routes.js";
import { getPublicFavicon, getPublicLogo, getPublicSite } from "./controllers/site.controller.js";
import { asyncHandler } from "./utils/asyncHandler.js";
import { getPublicCreditPackages, getPublicPricing, getPublicStatsHandler } from "./controllers/credit.controller.js";
import { receiveWebhook } from "./controllers/payment.controller.js";
import paymentRoutes from "./routes/payment.routes.js";

export function createApp() {
  const app = express();
  // Set this only to the number of trusted proxy hops in the deployment. Trusting
  // arbitrary X-Forwarded-For values lets clients bypass the IP rate limit.
  if (env.trustedProxyHops > 0) app.set("trust proxy", env.trustedProxyHops);

  app.use(helmet());
  // gzip/brotli for JSON and the site's files; most of the study content is text.
  app.use(compression());
  app.use(cors({ origin: env.frontendUrl, credentials: true }));
  // Keeps the exact bytes of each request too: payment provider notifications
  // are signed over them.
  app.use(express.json({ limit: "1mb", verify: (req, res, buf) => { req.rawBody = buf; } }));
  app.use(cookieParser());
  app.use(mongoSanitize()); // strips `$`/`.` keys from body/query/params to block NoSQL operator injection

  app.get("/api/health", (req, res) => {
    res.json({ success: true, data: { status: "ok" } });
  });
  app.use("/api", apiLimiter);
  app.use("/api/auth", authRoutes);
  app.get("/api/public/credit-packages", asyncHandler(getPublicCreditPackages));
  app.get("/api/public/pricing", asyncHandler(getPublicPricing));
  app.get("/api/public/stats", asyncHandler(getPublicStatsHandler));
  // Payment provider notifications: no session, checked by signature instead.
  app.post("/api/payments/webhooks/:provider", asyncHandler(receiveWebhook));
  app.get("/api/public/site", asyncHandler(getPublicSite));
  app.get("/api/public/logo", asyncHandler(getPublicLogo));
  app.get("/api/public/favicon", asyncHandler(getPublicFavicon));
  app.use(authenticate);
  app.use(csrfProtection);
  // Study material needs a monthly pass once the paywall is on. Credits,
  // settings, the site switches and admin stay open.
  app.use("/api/dashboard", requireAccess, dashboardRoutes);
  app.use("/api/credits", creditRoutes);
  app.use("/api/osce/attempts", requireAccessOrUnfinishedAttempt, osceAttemptRoutes);
  app.use("/api/osce", requireAccess, osceRoutes);
  app.use("/api/content", contentRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/ai", aiRoutes);
  app.use("/api/admin/osce", adminOsceRoutes);
  app.use("/api/admin/users", adminUserRoutes);
  app.use("/api/site", siteRoutes);
  app.use("/api/admin", adminSettingsRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
