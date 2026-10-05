import { env } from "../../../config/env.js";
import { testProvider } from "./test.provider.js";

// Payment providers. Each one implements:
//   name, label, isTest
//   createCheckout(checkout) -> { providerRef, redirectUrl }
//   verifyWebhook({ rawBody, headers }) -> { eventId, status: "paid"|"failed"|"ignored",
//     providerRef, checkoutId, amount, currency }   (throws on a bad signature)
// To connect a real provider (Safepay, PayFast, JazzCash, Easypaisa...), add
// its adapter here and set PAYMENT_PROVIDER to its name.
const PROVIDERS = { test: testProvider };

let warned = false;

// The provider in use, or null when online payments aren't available.
export function getProvider() {
  const provider = PROVIDERS[env.paymentProvider];
  if (!provider) {
    if (env.paymentProvider && !warned) {
      console.warn(`Unknown PAYMENT_PROVIDER "${env.paymentProvider}". Online payments are off.`);
      warned = true;
    }
    return null;
  }
  // Pretend payments must never run on the live site by accident.
  if (provider.isTest && env.isProduction && !env.allowTestPaymentsInProduction) return null;
  return provider;
}
