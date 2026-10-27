"use client";

import { useLayoutEffect } from "react";

/**
 * Embedded previews and browser refreshes can restore the previous scroll position.
 * Keep the landing page at its hero on fresh visits, but respect intentional hash links.
 */
export default function LandingScrollReset() {
  useLayoutEffect(() => {
    if (window.location.pathname !== "/" || window.location.hash) return;

    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";

    // useLayoutEffect runs before the first painted hydrated frame.
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });

    const frame = requestAnimationFrame(() => {
      // Browser restoration can happen after React attaches client behavior.
      // Only the initial render is corrected; normal user scrolling is untouched.
      if (!window.location.hash) {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      }
      root.style.scrollBehavior = previousScrollBehavior;
    });

    return () => {
      cancelAnimationFrame(frame);
      root.style.scrollBehavior = previousScrollBehavior;
    };
  }, []);

  return null;
}
