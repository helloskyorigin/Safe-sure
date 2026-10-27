import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./enhancements.css";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ShipSafe — Know the risks before you ship",
  description:
    "ShipSafe helps developers understand application security risks, why they matter, and how to fix them. Free initial assessment, $19 one-time detailed report.",
  openGraph: {
    title: "ShipSafe — Know the risks before you ship",
    description: "Clear, actionable application security. Free overview. $19 detailed report, one time.",
    type: "website",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <Script id="shipsafe-start-at-top" strategy="beforeInteractive">{"(() => {\n  // Keep fresh homepage visits anchored at the hero, not a stale iframe scroll offset.\n  // Do not override explicit #section links or a user's subsequent scrolling.\n  if (location.pathname !== \"/\" || location.hash) return;\n  try { history.scrollRestoration = \"manual\"; } catch (_) {}\n\n  let released = false;\n  let userInteracted = false;\n  const root = document.documentElement;\n  const previous = root.style.scrollBehavior;\n\n  function toTop() {\n    if (released || userInteracted || location.hash || location.pathname !== \"/\") return;\n    root.style.scrollBehavior = \"auto\";\n    window.scrollTo(0, 0);\n  }\n  function release() {\n    if (released) return;\n    released = true;\n    root.style.scrollBehavior = previous;\n    for (const eventName of [\"wheel\", \"touchstart\", \"pointerdown\", \"keydown\"]) {\n      window.removeEventListener(eventName, cancelReset, true);\n    }\n  }\n  function cancelReset() { userInteracted = true; release(); }\n\n  for (const eventName of [\"wheel\", \"touchstart\", \"pointerdown\", \"keydown\"]) {\n    window.addEventListener(eventName, cancelReset, { capture: true, passive: true, once: true });\n  }\n\n  toTop();\n  // Browsers, especially embedded previews, can restore scroll after parsing.\n  // Each callback executes only during the initial page display.\n  window.addEventListener(\"DOMContentLoaded\", () => {\n    toTop();\n    requestAnimationFrame(toTop);\n  }, { once: true });\n  window.addEventListener(\"pageshow\", () => {\n    toTop();\n    requestAnimationFrame(() => {\n      toTop();\n      requestAnimationFrame(() => { toTop(); release(); });\n    });\n  }, { once: true });\n})();"}</Script>
        <meta name="theme-color" content="#fcfdff" />
      </head>
      <body>{children}</body>
    </html>
  );
}
