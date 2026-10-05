import { useEffect, useState } from "react";
import { getContentPath } from "./api";
import { accessOpen, useSite } from "./site";

// Study content comes from the server, one catalog, guide page or block at a
// time, only for accounts with access. It is kept in memory for this visit
// only and cleared on sign-out; it is never written to localStorage or any
// other storage. The browser may also keep its own copy, but the server
// re-checks access before every reuse.
const cache = new Map();

export function loadContent(path) {
  if (!cache.has(path)) {
    cache.set(path, getContentPath(path).catch((error) => {
      cache.delete(path);
      throw error;
    }));
  }
  return cache.get(path);
}

// Fetch in the background so the next block opens instantly.
export function preloadContent(path) {
  loadContent(path).catch(() => {});
}

export function clearContentCache() {
  cache.clear();
}

// Waits until the account is known to have access, so a locked page never
// asks the server for content.
export function useContent(path) {
  const open = accessOpen(useSite());
  const [state, setState] = useState({ data: null, error: "", path: null });
  useEffect(() => {
    if (!path || !open) return undefined;
    let active = true;
    loadContent(path)
      .then((data) => active && setState({ data, error: "", path }))
      .catch((error) => active && setState({ data: null, error: error.message, path }));
    return () => {
      active = false;
    };
  }, [path, open]);
  const current = state.path === path;
  return { data: current ? state.data : null, error: current ? state.error : "", loading: !current || (!state.data && !state.error) };
}

// Years -> blocks -> topics for MCQs and OSPE, and the guide page lists.
export const useCatalog = () => useContent("/catalog");

export const findYear = (years, slug) => years?.find((y) => y.slug === slug) || null;
export const findBlock = (year, slug) => year?.blocks.find((b) => b.slug === slug) || null;

// Questions (or OSPE stations) for a topic, a block, or a whole year. A year
// is fetched block by block, since the server only sends one at a time.
async function loadItems(kind, key, year, blockSlug, topicSlug) {
  if (!year) throw new Error("Unknown year.");
  const blocks = blockSlug ? [findBlock(year, blockSlug)].filter(Boolean) : year.blocks;
  if (!blocks.length) throw new Error("Unknown section.");
  const results = [];
  for (const block of blocks) {
    const query = topicSlug ? `?topic=${encodeURIComponent(topicSlug)}` : "";
    const data = await loadContent(`/${kind}/${year.slug}/${block.slug}${query}`);
    results.push(...data[key]);
  }
  return results;
}

export const loadQuestions = (year, blockSlug, topicSlug) => loadItems("mcqs", "questions", year, blockSlug, topicSlug);
export const loadStations = (year, blockSlug, topicSlug) => loadItems("ospe", "stations", year, blockSlug, topicSlug);

// Preloads the block after this one in the same year.
export function preloadNextBlock(kind, year, blockSlug) {
  if (!year || !blockSlug) return;
  const index = year.blocks.findIndex((b) => b.slug === blockSlug);
  const next = year.blocks[index + 1];
  if (next) preloadContent(`/${kind}/${year.slug}/${next.slug}`);
}
