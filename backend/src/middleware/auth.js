import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { SESSION_COOKIE } from "../utils/authCookies.js";

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

    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.sub).lean();
    if (!user) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
      fullName: user.fullName,
      email: user.email,
      roleLabel: user.roleLabel,
    };
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired session." });
  }
}
