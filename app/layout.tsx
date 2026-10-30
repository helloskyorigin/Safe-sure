import type { Metadata } from "next";
import "./globals.css";
import "./enhancements.css";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Secuvora — AI Security Agent for Developers",
  description:
    "Discover security risks in your GitHub code with Secuvora. Investigate potential exposed credentials, vulnerable dependencies and unsafe configurations with source-level evidence and actionable fixes. Current analysis uses security rules and OSV advisories; model-based reasoning is not yet enabled.",
  openGraph: {
    title: "Secuvora — AI Security Agent for Developers",
    description: "Investigate code security with source-level evidence, verified vulnerability advisories and actionable remediation. One agent workflow. Full report free.",
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
    <html lang="en">
      <head>
        <Script id="secuvora-disable-scroll-restore" strategy="beforeInteractive">{"try { history.scrollRestoration = 'manual'; } catch (e) {}"}</Script>
        <Script id="secuvora-theme-init" strategy="beforeInteractive">{"try { const t = localStorage.getItem('secuvora:theme'); const theme = t === 'dark' ? 'dark' : 'light'; document.documentElement.dataset.theme = theme; const meta = document.querySelector('meta[name=\"theme-color\"]'); if (meta) meta.setAttribute('content', theme === 'dark' ? '#090d14' : '#fcfdff'); } catch (e) { document.documentElement.dataset.theme = 'light'; }"}</Script>
        <meta name="theme-color" content="#fcfdff" />
      </head>
      <body>{children}</body>
    </html>
  );
}
