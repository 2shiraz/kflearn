import mongoose from "mongoose";

// Every provider notification we've acted on, by the provider's event id, so
// a repeated or replayed notification is never processed twice.
const webhookEventSchema = new mongoose.Schema(
  {
    provider: { type: String, required: true },
    eventId: { type: String, required: true },
    checkoutId: { type: String, default: "" },
    outcome: { type: String, default: "" },
  },
  { timestamps: true },
);

webhookEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });

export const WebhookEvent = mongoose.model("WebhookEvent", webhookEventSchema);
