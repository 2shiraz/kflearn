import { useEffect, useState } from "react";
import { getPaymentOptions, startCheckout } from "./api";

// Whether this account can pay online right now (a payment provider is set
// up and the admin has switched online payments on). Null while loading.
export function usePaymentOptions() {
  const [options, setOptions] = useState(null);
  useEffect(() => {
    let live = true;
    getPaymentOptions()
      .then((data) => live && setOptions(data))
      .catch(() => live && setOptions({ enabled: false }));
    return () => { live = false; };
  }, []);
  return options;
}

// Starts checkout and sends the browser to the payment page. Only http(s)
// addresses are followed.
export async function beginCheckout(item) {
  const { redirectUrl } = await startCheckout(item);
  const url = new URL(redirectUrl, window.location.origin);
  if (!["https:", "http:"].includes(url.protocol)) throw new Error("We couldn't open the payment page. Please try again.");
  window.location.assign(url.href);
}
