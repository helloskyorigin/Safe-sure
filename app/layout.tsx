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
    <html lang="en" className={inter.variable}>
      <head>
        <Script id="secuvora-disable-scroll-restore" strategy="beforeInteractive">{"try { history.scrollRestoration = 'manual'; } catch (e) {}"}</Script>
        <meta name="theme-color" content="#fcfdff" />
      </head>
      <body>{children}</body>
    </html>
  );
}
