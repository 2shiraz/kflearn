import crypto from "node:crypto";

// Profile pictures are a fixed set of bundled images (frontend
// /illustrations/avatars/<id>.svg). The user record stores only the id.
export const AVATAR_IDS = Array.from({ length: 20 }, (_, i) => `a${String(i + 1).padStart(2, "0")}`);

export function isAvatarId(value) {
  return typeof value === "string" && AVATAR_IDS.includes(value);
}

export function randomAvatarId() {
  return AVATAR_IDS[crypto.randomInt(AVATAR_IDS.length)];
}

// Accounts created before avatars existed have none stored. Derive a stable
// one from the user id so it never changes between requests.
export function avatarFor(user) {
  if (isAvatarId(user.avatar)) return user.avatar;
  const hash = crypto.createHash("sha256").update(String(user._id)).digest();
  return AVATAR_IDS[hash.readUInt32BE(0) % AVATAR_IDS.length];
}
