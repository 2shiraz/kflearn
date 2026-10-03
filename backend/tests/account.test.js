import assert from "node:assert/strict";
import { test, before, after, beforeEach } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../src/app.js";
import { AVATAR_IDS } from "../src/config/avatars.js";
import { CreditTransaction } from "../src/models/CreditTransaction.js";
import { OsceAttempt } from "../src/models/OsceAttempt.js";
import { User } from "../src/models/User.js";
import { grantCredits } from "../src/services/credit.service.js";

let mongod;
let app;

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  app = createApp();
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await mongoose.connection.db.dropDatabase();
});

const PASSWORD = "StrongPass123";

async function register(email = "student@example.com") {
  const res = await request(app).post("/api/auth/register").send({ fullName: "Test Student", email, password: PASSWORD });
  assert.equal(res.status, 201);
  return { token: res.body.data.token, user: res.body.data.user };
}

const auth = (token) => ({ Authorization: `Bearer ${token}` });

test("new accounts get a random avatar id that can be changed to another valid id", async () => {
  const { token, user } = await register();
  assert.ok(AVATAR_IDS.includes(user.avatar));
  const stored = await User.findById(user.id).lean();
  assert.equal(stored.avatar, user.avatar);

  const next = AVATAR_IDS.find((id) => id !== user.avatar);
  const ok = await request(app).patch("/api/auth/me").set(auth(token)).send({ avatar: next });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.data.user.avatar, next);

  for (const bad of ["a21", "../x", "https://evil.example/x.png", 3]) {
    const res = await request(app).patch("/api/auth/me").set(auth(token)).send({ avatar: bad });
    assert.equal(res.status, 400);
  }
});

test("older accounts without a stored avatar get a stable derived one", async () => {
  const { token, user } = await register();
  await User.updateOne({ _id: user.id }, { $unset: { avatar: 1 } });
  const a = await request(app).get("/api/auth/me").set(auth(token));
  const b = await request(app).get("/api/auth/me").set(auth(token));
  assert.ok(AVATAR_IDS.includes(a.body.data.user.avatar));
  assert.equal(a.body.data.user.avatar, b.body.data.user.avatar);
});

test("password change needs the current password and signs out other sessions", async () => {
  const { token: oldToken } = await register();

  const wrong = await request(app).post("/api/auth/password").set(auth(oldToken)).send({ currentPassword: "nope12345", newPassword: "NewPass4567" });
  assert.equal(wrong.status, 400);
  assert.equal(wrong.body.code, "WRONG_PASSWORD");

  const weak = await request(app).post("/api/auth/password").set(auth(oldToken)).send({ currentPassword: PASSWORD, newPassword: "short" });
  assert.equal(weak.status, 400);

  const same = await request(app).post("/api/auth/password").set(auth(oldToken)).send({ currentPassword: PASSWORD, newPassword: PASSWORD });
  assert.equal(same.status, 400);

  const ok = await request(app).post("/api/auth/password").set(auth(oldToken)).send({ currentPassword: PASSWORD, newPassword: "NewPass4567" });
  assert.equal(ok.status, 200);
  const newToken = ok.body.data.token;
  assert.ok(newToken);

  assert.equal((await request(app).get("/api/auth/me").set(auth(oldToken))).status, 401);
  assert.equal((await request(app).get("/api/auth/me").set(auth(newToken))).status, 200);

  const oldLogin = await request(app).post("/api/auth/login").send({ email: "student@example.com", password: PASSWORD });
  assert.equal(oldLogin.status, 401);
  const newLogin = await request(app).post("/api/auth/login").send({ email: "student@example.com", password: "NewPass4567" });
  assert.equal(newLogin.status, 200);
});

test("password change is CSRF protected for cookie sessions", async () => {
  const agent = request.agent(app);
  const reg = await agent.post("/api/auth/register").set("Origin", "http://localhost:5173")
    .send({ fullName: "Cookie User", email: "cookie@example.com", password: PASSWORD });
  assert.equal(reg.status, 201);
  const res = await agent.post("/api/auth/password").send({ currentPassword: PASSWORD, newPassword: "NewPass4567" });
  assert.equal(res.status, 403);
});

test("account deletion needs the password and confirmation, then removes the user's data", async () => {
  const { token, user } = await register();
  const other = await register("other@example.com");
  await grantCredits({ userId: user.id, amount: 50 });
  await grantCredits({ userId: other.user.id, amount: 50 });

  const noConfirm = await request(app).post("/api/auth/me/delete").set(auth(token)).send({ password: PASSWORD });
  assert.equal(noConfirm.status, 400);
  const wrong = await request(app).post("/api/auth/me/delete").set(auth(token)).send({ password: "nope12345", confirmation: "DELETE" });
  assert.equal(wrong.status, 400);
  assert.ok(await User.exists({ _id: user.id }));

  const ok = await request(app).post("/api/auth/me/delete").set(auth(token)).send({ password: PASSWORD, confirmation: "DELETE" });
  assert.equal(ok.status, 200);
  assert.equal(await User.exists({ _id: user.id }), null);
  assert.equal(await CreditTransaction.countDocuments({ userId: user.id }), 0);
  assert.equal(await OsceAttempt.countDocuments({ userId: user.id }), 0);
  assert.equal(await CreditTransaction.countDocuments({ userId: other.user.id }), 1);
  assert.equal((await request(app).get("/api/auth/me").set(auth(token))).status, 401);
});

test("admin accounts can't be deleted from settings", async () => {
  const { token, user } = await register();
  await User.updateOne({ _id: user.id }, { role: "admin" });
  const res = await request(app).post("/api/auth/me/delete").set(auth(token)).send({ password: PASSWORD, confirmation: "DELETE" });
  assert.equal(res.status, 403);
  assert.ok(await User.exists({ _id: user.id }));
});
