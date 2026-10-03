import { AdminAuditLog } from "../models/AdminAuditLog.js";

const LABELS = [
  [/^PATCH \/admin\/settings\/site$/, "Changed site access"],
  [/^PATCH \/admin\/settings\/pricing$/, "Changed pricing"],
  [/^PATCH \/admin\/settings\/branding$/, "Changed branding"],
  [/^POST \/admin\/announcements$/, "Posted an announcement"],
  [/^PATCH \/admin\/announcements\//, "Edited an announcement"],
  [/^DELETE \/admin\/announcements\//, "Deleted an announcement"],
  [/^PATCH \/admin\/users\/[^/]+$/, "Edited an account"],
  [/^POST \/admin\/users\/[^/]+\/credits$/, "Changed AI credits"],
  [/^POST \/admin\/users\/[^/]+\/delete$/, "Deleted an account"],
  [/^POST \/admin\/osce\/import$/, "Imported stations"],
  [/^POST \/admin\/osce$/, "Created a station"],
  [/^PATCH \/admin\/osce\/[^/]+\/status$/, "Changed a station's status"],
  [/^PATCH \/admin\/osce\/[^/]+$/, "Edited a station"],
  [/^DELETE \/admin\/osce\/[^/]+$/, "Deleted a station"],
  [/^POST \/admin\/payments$/, "Recorded a payment"],
  [/^POST \/admin\/payments\/[^/]+\/refund$/, "Refunded a payment"],
  [/^PATCH \/ai\/status$/, "Changed AI settings"],
];

// Field names are logged so the record says what changed; values are not,
// because they can include API keys.
const SKIP_FIELDS = new Set(["password", "confirmation", "confirmTitle"]);

export function auditAdminChanges(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const path = (req.baseUrl + req.path).replace(/^\/api/, "");
  const key = `${req.method} ${path}`;
  res.on("finish", () => {
    if (res.statusCode >= 400 || !req.user) return;
    const action = LABELS.find(([pattern]) => pattern.test(key))?.[1] || key;
    const fields = Object.keys(req.body || {}).filter((f) => !SKIP_FIELDS.has(f)).slice(0, 20);
    AdminAuditLog.create({
      actorId: req.user.id,
      actorEmail: req.user.email || "",
      action,
      target: path.match(/[a-f0-9]{24}/)?.[0] || "",
      fields,
      ip: req.ip || "",
    }).catch(() => {});
  });
  return next();
}
