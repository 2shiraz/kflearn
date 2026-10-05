import { env } from "../../config/env.js";

// Sends email through the configured provider. For now there are two:
//   console   prints each message to the server log (development)
//   disabled  sends nothing
// A real provider (Resend, Brevo...) is added as one more entry in TRANSPORTS
// and chosen with EMAIL_PROVIDER. Callers never need to change.

// The last few messages, for tests and local debugging. Never kept on the
// live site (they hold reset links).
export const outbox = [];

const TRANSPORTS = {
  console: async (message) => {
    if (env.nodeEnv === "test") return;
    console.log(`\n--- email to ${message.to} ---\nSubject: ${message.subject}\n\n${message.text}\n--- end of email ---\n`);
  },
  disabled: async () => {},
};

// Whether emails actually go anywhere (password reset links depend on it).
export const emailEnabled = () => Boolean(TRANSPORTS[env.emailProvider]) && env.emailProvider !== "disabled";

export async function sendEmail({ to, subject, text }) {
  const message = { from: env.emailFrom, to, subject, text, at: new Date() };
  if (!env.isProduction) {
    outbox.push(message);
    if (outbox.length > 50) outbox.shift();
  }
  const transport = TRANSPORTS[env.emailProvider] || TRANSPORTS.disabled;
  try {
    await transport(message);
    return true;
  } catch (error) {
    // Email never breaks the action that triggered it.
    console.error("Email failed:", error.message);
    return false;
  }
}
