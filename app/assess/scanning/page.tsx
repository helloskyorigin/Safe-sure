import type { Metadata } from "next";
import ScanningConsole from "@/components/ScanningConsole";
import "./scanning.css";

export const metadata: Metadata = {
  title: "Security analysis | Secuvora",
  description: "Review supported security signals with real source checks, clear coverage and evidence-driven progress.",
  robots: { index: false, follow: false },
};

export default function ScanningPage() {
  return <ScanningConsole />;
}
