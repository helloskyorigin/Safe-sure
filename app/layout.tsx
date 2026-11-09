import type { Metadata } from "next";
import "./globals.css";
import "./enhancements.css";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Secuvora — Security Checks for AI-Built Apps",
  description:
    "Review your AI-built app's GitHub repository for credential patterns, vulnerable dependencies and unsafe configurations. Secuvora uses bounded read-only source checks and OSV advisories with file-level evidence. No AI-model reasoning or live penetration testing.",
  openGraph: {
    title: "Secuvora — AI Security Agent for Developers",
    description: "Read-only GitHub repository security checks for AI-built apps: credential patterns, vulnerable dependencies and unsafe configurations, with source-level evidence and practical next steps.",
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
