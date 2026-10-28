import type { Metadata } from "next";
import SavedReports from "@/components/SavedReports";
import "../assess.css";
export const metadata: Metadata = { title: "Security agent history | Secuvora",
  robots: { index: false, follow: false } };
export default function HistoryPage() { return <SavedReports/>; }
