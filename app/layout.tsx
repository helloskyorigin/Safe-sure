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
  title: "Secuvora — AI Security Agent in development",
  description:
    "Secuvora is building an AI-native security agent for developers. Its current free beta already investigates GitHub repositories with real read-only source rules and OSV vulnerability intelligence. Model-based AI reasoning is planned, not yet live.",
  openGraph: {
    title: "Secuvora — AI Security Agent in development",
    description: "An evidence-backed security agent for developers. Read-only source analysis, published vulnerability intelligence and actionable findings, free.",
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
