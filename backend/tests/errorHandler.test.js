import assert from "node:assert/strict";
import { test } from "node:test";
import { env } from "../src/config/env.js";
import { errorHandler } from "../src/middleware/errorHandler.js";

test("production shows only explicitly safe server errors", () => {
  const original = env.isProduction;
  const originalConsoleError = console.error;
  env.isProduction = true;
  console.error = () => {};
  try {
    const respond = (error) => {
      const response = { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
      errorHandler(error, {}, response, () => {});
      return response;
    };
    const unsafe = new Error("private provider details");
    unsafe.status = 503;
    assert.equal(respond(unsafe).body.message, "Something went wrong. Please try again.");
    const safe = new Error("provider details stay hidden");
    safe.status = 503;
    safe.publicMessage = "AI marking failed. Please retry.";
    assert.equal(respond(safe).body.message, safe.publicMessage);
  } finally {
    env.isProduction = original;
    console.error = originalConsoleError;
  }
});
