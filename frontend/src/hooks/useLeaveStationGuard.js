import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { discardOsceAttempt, discardOsceAttemptOnExit } from "../lib/api";

// Guards an unfinished OSCE station. While `active`:
// - clicking any in-app link opens the leave dialog instead of navigating;
// - the browser Back button opens the same dialog (a duplicate history entry
//   absorbs the first Back press);
// - closing or reloading the tab shows the browser's own warning, and if the
//   page really unloads the attempt is discarded with a keepalive request.
// Confirming in the dialog discards the attempt on the server, then continues
// to wherever the student was going. The app uses <BrowserRouter>, which has no
// navigation blocker, hence the manual listeners.
export function useLeaveStationGuard({ attemptId, active }) {
  const navigate = useNavigate();
  const [pending, setPending] = useState(null); // { to } or { back: true }
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState("");
  const enabled = Boolean(active && attemptId);
  const enabledRef = useRef(enabled);
  const releasedRef = useRef(false);
  enabledRef.current = enabled && !releasedRef.current;

  useEffect(() => {
    if (!enabled) return undefined;

    function onClick(event) {
      if (!enabledRef.current || event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest?.("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      const to = url.pathname + url.search + url.hash;
      if (to === window.location.pathname + window.location.search + window.location.hash) return;
      event.preventDefault();
      event.stopPropagation();
      setError("");
      setPending({ to });
    }

    function onBeforeUnload(event) {
      if (!enabledRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    }

    function onPageHide() {
      if (enabledRef.current) discardOsceAttemptOnExit(attemptId);
    }

    // Capture phase so this runs before React Router's own popstate listener,
    // which stopImmediatePropagation then keeps from navigating.
    function onPopState(event) {
      if (!enabledRef.current) return;
      event.stopImmediatePropagation();
      window.history.pushState(window.history.state, "", window.location.href);
      setError("");
      setPending({ back: true });
    }

    window.history.pushState(window.history.state, "", window.location.href);
    document.addEventListener("click", onClick, true);
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("popstate", onPopState, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("popstate", onPopState, true);
    };
  }, [enabled, attemptId]);

  const stay = useCallback(() => {
    if (!leaving) setPending(null);
  }, [leaving]);

  const leave = useCallback(async () => {
    if (!pending || leaving) return;
    setLeaving(true);
    setError("");
    try {
      await discardOsceAttempt(attemptId);
    } catch (err) {
      // Already gone (404) or already being marked (409): nothing to discard.
      if (err.status !== 404 && err.status !== 409) {
        setLeaving(false);
        setError(err.message);
        return;
      }
    }
    releasedRef.current = true;
    enabledRef.current = false;
    const target = pending;
    setPending(null);
    if (target.back) window.history.go(-2);
    else navigate(target.to);
  }, [pending, leaving, attemptId, navigate]);

  return { open: Boolean(pending), leaving, error, stay, leave };
}
