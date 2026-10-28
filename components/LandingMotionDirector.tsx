"use client";

import { useEffect } from "react";

type RevealKind = "rise" | "slide-left" | "slide-right" | "scale" | "blur" | "pop";
type MotionGroup = {
  selector: string;
  kind: RevealKind;
  stagger?: number;
  delay?: number;
};

// Each group is a real landing-page element. Children reveal independently
// as the reader scrolls; they are NEVER reset when they leave the viewport.
const groups: MotionGroup[] = [
  { selector: "#how .section-heading", kind: "rise" },
  { selector: "#how .step", kind: "pop", stagger: 135 },
  { selector: ".value-heading .eyebrow", kind: "slide-left" },
  { selector: ".value-heading h2", kind: "rise", delay: 85 },
  { selector: ".value-heading > p", kind: "slide-right", delay: 150 },
  { selector: ".value-card .value-card-top", kind: "pop", stagger: 105 },
  { selector: ".value-card .value-watermark", kind: "blur", stagger: 125 },
  { selector: ".value-card .value-card-content", kind: "rise", stagger: 105, delay: 75 },
  { selector: ".experience-intro .eyebrow", kind: "slide-left" },
  { selector: ".experience-intro h2", kind: "rise", delay: 85 },
  { selector: ".experience-intro > p", kind: "slide-right", delay: 150 },
  { selector: ".experience-shell .experience-toolbar", kind: "rise" },
  { selector: ".experience-shell .experience-tabs", kind: "rise", delay: 80 },
  { selector: ".experience-shell .experience-content", kind: "scale", delay: 120 },
  { selector: ".experience-shell .experience-bottom", kind: "rise", delay: 80 },
  { selector: "#security .split-heading", kind: "rise" },
  { selector: "#security .trust-item", kind: "pop", stagger: 125 },
  { selector: "#pricing .pricing-intro", kind: "slide-left" },
  { selector: "#pricing .price-card", kind: "scale", delay: 120 },
  { selector: "#pricing .features li", kind: "slide-right", stagger: 65, delay: 60 },
  { selector: "#faq .faq-grid > div:first-child", kind: "slide-left" },
  { selector: "#faq .faq-entry", kind: "rise", stagger: 70 },
  { selector: ".final-cta-inner .final-eyebrow", kind: "pop" },
  { selector: ".final-cta-inner h2", kind: "rise", delay: 75 },
  { selector: ".final-cta-inner > p", kind: "blur", delay: 130 },
  { selector: ".final-cta-inner .final-button", kind: "pop", delay: 190 },
  { selector: ".final-cta-inner > small", kind: "rise", delay: 230 },
  { selector: ".footer-identity", kind: "slide-left" },
  { selector: ".footer-columns", kind: "slide-right" },
  { selector: ".copyright", kind: "rise" },
];

const STORE_KEY = "shipsafe:landing-reveals:v2";

/**
 * Motion design is progressively enhanced: before hydration or without IO,
 * everything is readable. Reduced-motion users see all content immediately.
 * Visible-once nodes stay visible on reverse scroll and across same-tab return.
 */
export default function LandingMotionDirector() {
  useEffect(() => {
    const root = document.getElementById("main");
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !("IntersectionObserver" in window)) return;

    const elements: { element: HTMLElement; key: string }[] = [];
    for (const [groupIndex, group] of groups.entries()) {
      root.querySelectorAll<HTMLElement>(group.selector).forEach((element, index) => {
        const key = groupIndex + ":" + index;
        element.dataset.shipMotion = group.kind;
        element.dataset.shipMotionKey = key;
        element.style.setProperty("--ship-stagger", String(Math.min(380, (group.delay || 0) + index * (group.stagger || 0))) + "ms");
        elements.push({ element, key });
      });
    }

    let previouslyRevealed = new Set<string>();
    try {
      const value = window.sessionStorage.getItem(STORE_KEY);
      if (value) {
        const parsed: unknown = JSON.parse(value);
        if (Array.isArray(parsed)) previouslyRevealed = new Set(parsed.filter((v): v is string => typeof v === "string"));
      }
    } catch { /* Storage may be disabled; animations still work in memory. */ }

    const pending: HTMLElement[] = [];
    for (const { element, key } of elements) {
      if (previouslyRevealed.has(key)) element.classList.add("ship-motion-revealed");
      else pending.push(element);
    }
    if (pending.length === 0) return;
    // Apply the hiding styles only AFTER targets + the observer are set up.
    // There is no content invisibility if JS, IO or hydration fails.
    const observer = new IntersectionObserver(entries => {
      let changed = false;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const element = entry.target as HTMLElement;
        element.classList.add("ship-motion-revealed");
        const key = element.dataset.shipMotionKey;
        if (key && !previouslyRevealed.has(key)) {
          previouslyRevealed.add(key);
          changed = true;
        }
        observer.unobserve(element); // Never animate this element twice.
      }
      if (changed) {
        try { window.sessionStorage.setItem(STORE_KEY, JSON.stringify([...previouslyRevealed])); }
        catch { /* harmless if blocked */ }
      }
    }, { threshold: 0.09, rootMargin: "0px 0px -28px 0px" });

    pending.forEach(element => observer.observe(element));
    root.classList.add("landing-motion-active");

    // The root class is never toggled on scrolling; only an explicit unmount
    // removes our observer. Animated nodes retain their final visible state.
    return () => { observer.disconnect(); root.classList.remove("landing-motion-active"); };
  }, []);

  return null;
}
