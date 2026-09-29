import { User } from "../models/User.js";

export async function listAdminUsers(req, res) {
  const users = await User.find().select("-passwordHash").sort({ createdAt: -1 }).lean();
  res.json({
    success: true,
    data: users.map((user) => ({
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      roleLabel: user.roleLabel,
      profile: user.profile,
      creditBalance: user.creditBalance ?? 0,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })),
  });
}
