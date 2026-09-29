// Client-side view of the credit balance, shared by the sidebar and any page
// that spends credits. Display only — the server enforces every charge.
import { useEffect, useSyncExternalStore } from "react";
import { getCredits } from "./api";

let snapshot = { balance: null, pricing: null };
const listeners = new Set();
let inflight = null;

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
      emit();
      return data;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

// Refetches on every mount so the balance is never stale after navigation or
// a switch of account in the same tab.
export function useCredits() {
  const state = useSyncExternalStore(subscribe, () => snapshot);
  useEffect(() => {
    refreshCredits().catch(() => {});
  }, []);
  return state;
}

export function isCreditError(error) {
  return error?.code === "INSUFFICIENT_CREDITS" || error?.code === "SESSION_NOT_PAID";
}
