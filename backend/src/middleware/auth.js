import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { SESSION_COOKIE } from "../utils/authCookies.js";
import { touchSession } from "../services/session.service.js";

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.header("authorization") || "";
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    // Cookie is the primary path for the browser app; Bearer stays available for non-browser API clients.
    const cookieToken = req.cookies?.[SESSION_COOKIE] || "";
    const token = cookieToken || bearerToken;

    if (!token) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }
    // CSRF only matters for cookie-authenticated requests (browsers auto-attach cookies);
    // a request authenticated via an explicit Bearer header is not exploitable that way.
    req.authViaCookie = Boolean(cookieToken);

    const payload = jwt.verify(token, env.jwtSecret, { algorithms: ["HS256"] });
    const user = await User.findById(payload.sub).lean();
    if (!user || user.suspended || payload.sv !== (user.sessionVersion || 0)) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }
    // The device's session must still be open: signed out from another
    // device, or bumped by the two-device limit, ends it at once.
    if (!(await touchSession(payload.sid, user._id, { ip: req.ip, userAgent: req.get("User-Agent") || "" }))) {
      return res.status(401).json({ success: false, message: "You were signed out on this device.", code: "SESSION_ENDED" });
    }
    req.sessionId = payload.sid;

    // Record activity, but write at most once every 5 minutes per account.
    if (!user.lastActiveAt || Date.now() - new Date(user.lastActiveAt).getTime() > 5 * 60 * 1000) {
      User.updateOne({ _id: user._id }, { $set: { lastActiveAt: new Date() } }).catch(() => {});
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
      fullName: user.fullName,
      email: user.email,
      roleLabel: user.roleLabel,
    };
    res.set("Cache-Control", "no-store");
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired session." });
  }
}
