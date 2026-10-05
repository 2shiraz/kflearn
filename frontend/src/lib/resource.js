import { useCallback, useEffect, useState } from "react";

// A value loaded from the server and shared by every page that needs it, kept
// in memory for this visit. Pages show the kept value straight away; if it's
// older than maxAgeMs it is refreshed in the background. Many callers asking
// at once share one request.
export function createResource(load, { maxAgeMs }) {
  let data;
  let loadedAt = 0;
  let request = null;
  let generation = 0;
  const listeners = new Set();
  const emit = () => listeners.forEach((listener) => listener());

  function fetchNow() {
    const mine = generation;
    request ??= load()
      .then((value) => {
        if (mine === generation) {
          data = value;
          loadedAt = Date.now();
          emit();
        }
        return value;
      })
      .finally(() => {
        request = null;
      });
    return request;
  }

  const fresh = () => data !== undefined && Date.now() - loadedAt < maxAgeMs;

  return {
    // Resolves with a value no older than maxAgeMs.
    get: () => (fresh() ? Promise.resolve(data) : fetchNow()),
    peek: () => data,
    refresh: fetchNow,
    prefetch: () => { if (!fresh()) fetchNow().catch(() => {}); },
    // Drops the kept value, so the next use loads it again.
    clear: () => {
      generation += 1;
      data = undefined;
      loadedAt = 0;
      request = null;
      emit();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    isFresh: fresh,
  };
}

// Keyed resources (one per station slug, for example).
export function createResourceFamily(load, options) {
  const members = new Map();
  const member = (key) => {
    if (!members.has(key)) members.set(key, createResource(() => load(key), options));
    return members.get(key);
  };
  return { member, clear: () => { members.forEach((m) => m.clear()); members.clear(); } };
}

// { data, error, loading, reload } for a resource. With enabled false nothing
// is requested (for example while the account has no access).
export function useResource(resource, { enabled = true } = {}) {
  const [state, setState] = useState(() => ({ data: resource?.peek(), error: "" }));

  useEffect(() => {
    if (!resource) return undefined;
    setState({ data: resource.peek(), error: "" });
    return resource.subscribe(() => setState((s) => ({ data: resource.peek() ?? s.data, error: "" })));
  }, [resource]);

  const load = useCallback((force = false) => {
    if (!resource || !enabled) return;
    setState((s) => ({ ...s, error: "" }));
    (force ? resource.refresh() : resource.get())
      .then((data) => setState({ data, error: "" }))
      .catch((err) => setState((s) => ({ ...s, error: err.message })));
  }, [resource, enabled]);

  useEffect(() => { load(); }, [load]);

  return {
    data: state.data,
    error: state.error,
    loading: state.data === undefined && !state.error,
    reload: () => load(true),
  };
}
