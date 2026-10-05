// Plain-text emails. Kept short and free of anything a student would need to
// act on urgently except the one link or date.
const longDate = (value) => new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
const greet = (name) => `Hi ${String(name || "").split(" ")[0] || "there"},`;

export function passwordResetEmail({ name, link, siteName }) {
  return {
    subject: `Reset your ${siteName} password`,
    text: `${greet(name)}

Someone asked to reset the password for your ${siteName} account. To choose a new password, open this link within 30 minutes:

${link}

If it wasn't you, you can ignore this email. Your password stays the same.`,
  };
}

export function receiptEmail({ name, item, amount, currency, paidAt, until, credits, siteName }) {
  const detail = until ? `Your access now runs until ${longDate(until)}.` : credits ? `${credits.toLocaleString()} AI credits were added to your account.` : "";
  return {
    subject: `Your ${siteName} receipt`,
    text: `${greet(name)}

Thank you. We've received your payment.

${item}
${currency} ${amount.toLocaleString()}, paid ${longDate(paidAt)}

${detail}`.trim(),
  };
}

export function accessEndingEmail({ name, until, siteName }) {
  return {
    subject: `Your ${siteName} access ends on ${longDate(until)}`,
    text: `${greet(name)}

Your monthly access ends on ${longDate(until)}. Renew before then to keep every station, question bank and guide open. Renewing early adds the new days after your current ones, so you lose nothing.`,
  };
}

export function accessEndedEmail({ name, graceUntil, siteName }) {
  return {
    subject: `Your ${siteName} access has ended`,
    text: `${greet(name)}

Your monthly access has ended. You can keep using the site until ${longDate(graceUntil)}. Renew before then to avoid losing access. Your progress and AI credits are kept.`,
  };
}
