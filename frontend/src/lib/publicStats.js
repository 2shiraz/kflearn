import { useEffect, useState } from "react";
import { getPublicPricing, getPublicStats } from "./api";

// Counts for the public pages (MCQs, OSPE stations, guides...) and the monthly
// plan price, from the server. Public pages never import the content banks
// themselves. The last answer is kept in localStorage so a returning visitor
// sees the right numbers on first paint; until the first answer arrives the
// figures below are shown.
const STATS_KEY = "kf_public_stats";
const PRICING_KEY = "kf_public_pricing";

export const FALLBACK_STATS = {
  mcq: { total: 5000, years: [] },
  ospe: { total: 400, years: [] },
  osce: { total: 0 },
  examGuides: { total: 19, titles: [] },
  historyGuides: { total: 9, titles: [] },
  handouts: { total: 47, systems: [] },
};

export const FALLBACK_PRICING = { plan: { pricePkr: 1499, periodDays: 30, graceDays: 3 }, packages: [] };

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || null;
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage blocked: the figures still show for this visit.
  }
}

// One shared value and one request per page load, however many components
// ask for it.
function createStore(key, fallback, load) {
  let value = read(key);
  let loaded = false;
  let request = null;
  const listeners = new Set();
  function refresh() {
    request ??= load()
      .then((next) => {
        value = next;
        loaded = true;
        write(key, next);
        for (const listener of listeners) listener(next);
      })
      .catch(() => {});
    return request;
  }
  return function useStore() {
    const [current, setCurrent] = useState(value);
    useEffect(() => {
      listeners.add(setCurrent);
      if (!loaded) refresh();
      else setCurrent(value);
      return () => listeners.delete(setCurrent);
    }, []);
    return { ...fallback, ...current, loaded: loaded || Boolean(current) };
  };
}

export const usePublicStats = createStore(STATS_KEY, FALLBACK_STATS, getPublicStats);
export const usePublicPricing = createStore(PRICING_KEY, FALLBACK_PRICING, getPublicPricing);

const YEAR_LABELS = { 1: "First Year", 2: "Second Year", 3: "Third Year", 4: "Fourth Year", 5: "Final Year" };

// Per-year coverage for the landing page: MCQ modules and OSPE blocks.
export function yearCoverage(stats) {
  return (stats.mcq.years || []).map((mcq) => {
    const ospe = (stats.ospe.years || []).find((y) => y.year === mcq.year);
    return {
      year: mcq.year,
      label: YEAR_LABELS[mcq.year] || mcq.name,
      mcqCount: mcq.count,
      mcqBlocks: mcq.blocks.map((b) => b.name),
      ospeCount: ospe?.count || 0,
      ospeBlocks: ospe ? ospe.blocks.map((b) => b.name) : [],
    };
  });
}
