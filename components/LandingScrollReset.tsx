"use client";

import { useLayoutEffect } from "react";

/**
 * Browser tabs and embedded previews sometimes restore stale scroll positions
 * after hydration. The previous implementation stopped resetting after one
 * animation frame, so a later native restoration could animate to the footer.
 *
 * This guard only runs during the initial homepage display. The moment a user
 * interacts, it stands down and never interferes with their scrolling.
 */
export default function LandingScrollReset() {
  useLayoutEffect(() => {
    // Respect explicitly shared #section links and user-intended deep links.
    if (window.location.hash) return;

    let active = true;
    let resetQueued = false;
    let raf = 0;
    const timers: number[] = [];
    const root = document.documentElement;
    root.dataset.shipsafeScrollGuard = "active";
    const previousInlineScrollBehavior = root.style.scrollBehavior;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Stop native scroll restoration from using smooth behavior.
    root.style.scrollBehavior = "auto";
    try {
      window.history.scrollRestoration = "manual";
    } catch {
      // Some embedded browsers do not expose this setting.
    }

    function goToTop() {
      if (!active || window.location.hash) return;
      if (window.scrollY > 0 || window.scrollX > 0) {
        window.scrollTo({ left: 0, top: 0, behavior: "instant" });
      }
    }

    function cleanup() {
      if (!active) return;
      active = false;
      delete root.dataset.shipsafeScrollGuard;
      window.cancelAnimationFrame(raf);
      for (const id of timers) window.clearTimeout(id);
      root.style.scrollBehavior = previousInlineScrollBehavior;
      window.removeEventListener("scroll", catchUnexpectedScroll);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("load", goToTop);
      for (const type of ["wheel", "touchstart", "pointerdown", "keydown"] as const) {
        window.removeEventListener(type, stopOnUserIntent, true);
      }
    }

    function stopOnUserIntent() {
      // Never fight with a user's touch, wheel, keyboard or navigation click.
      cleanup();
    }

    function catchUnexpectedScroll() {
      if (!active || resetQueued) return;
      resetQueued = true;
      raf = window.requestAnimationFrame(() => {
        resetQueued = false;
        goToTop();
      });
    }

    function onPageShow() {
      goToTop();
      raf = window.requestAnimationFrame(goToTop);
    }

    for (const type of ["wheel", "touchstart", "pointerdown", "keydown"] as const) {
      window.addEventListener(type, stopOnUserIntent, { capture: true, passive: true });
    }

    window.addEventListener("scroll", catchUnexpectedScroll, { passive: true });
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("load", goToTop, { once: true });

    // Recheck during the short restoration window after hydration.
    goToTop();
    [80, 280, 750, 1500, 2800].forEach((delay) => {
      timers.push(window.setTimeout(goToTop, delay));
    });

    // Bounded: normal browser navigation and scrolling are untouched afterwards.
    timers.push(window.setTimeout(cleanup, 4000));

    return cleanup;
  }, []);

  // Click-based smooth anchor navigation, rather than global CSS smooth scroll.
  useLayoutEffect(() => {
    const handler = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!anchor || anchor.hasAttribute("data-start")) return;
      const hash = anchor.getAttribute("href");
      if (!hash || hash.length < 2) return;
      const target = document.getElementById(hash.slice(1));
      if (!target) return;
      event.preventDefault();
      window.history.pushState(null, "", hash);
      target.scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  return null;
}
