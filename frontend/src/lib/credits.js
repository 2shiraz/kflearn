// Client-side view of the credit balance, shared by the sidebar and any page
// that spends credits. Display only — the server enforces every charge.
import { useEffect, useSyncExternalStore } from "react";
import { getCredits } from "./api";

let snapshot = { balance: null, pricing: null };
const listeners = new Set();
let inflight = null;
let loadedAt = 0;
// Spending and buying update the balance from the server's own answer, so a
// balance this recent doesn't need asking for again on every page.
const MAX_AGE_MS = 60 * 1000;

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setCreditBalance(balance) {
  if (!Number.isFinite(balance)) return;
  snapshot = { ...snapshot, balance };
  emit();
}

export function refreshCredits() {
  inflight ??= getCredits()
    .then((data) => {
      snapshot = { balance: data.balance, pricing: data };
      loadedAt = Date.now();
      emit();
      return data;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function clearCredits() {
  snapshot = { balance: null, pricing: null };
  loadedAt = 0;
  inflight = null;
  emit();
}

// Loads the balance when the page opens unless it was loaded in the last
// minute (the sidebar and the page share one request).
export function useCredits() {
  const state = useSyncExternalStore(subscribe, () => snapshot);
  useEffect(() => {
    if (Date.now() - loadedAt > MAX_AGE_MS) refreshCredits().catch(() => {});
  }, []);
  return state;
}

export function isCreditError(error) {
  return error?.code === "INSUFFICIENT_CREDITS" || error?.code === "SESSION_NOT_PAID";
}
