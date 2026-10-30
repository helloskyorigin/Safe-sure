import type { Metadata, Viewport } from "next";
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
    "Secuvora helps developers understand application security risks, why they matter, and how to fix them with clear, actionable application security assessments.",
  openGraph: {
    title: "Secuvora — AI Security Agent for Developers",
    description:
      "Secuvora helps developers understand application security risks, why they matter, and how to fix them with clear, actionable application security assessments.",
    type: "website",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#fcfdff",
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
        <Script id="secuvora-theme-init" strategy="beforeInteractive">{"try { const t = localStorage.getItem('secuvora:theme'); const theme = t === 'dark' ? 'dark' : 'light'; document.documentElement.dataset.theme = theme; const meta = document.querySelector('meta[name=\"theme-color\"]'); if (meta) meta.setAttribute('content', theme === 'dark' ? '#090d14' : '#fcfdff'); } catch (e) { document.documentElement.dataset.theme = 'light'; }"}</Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
