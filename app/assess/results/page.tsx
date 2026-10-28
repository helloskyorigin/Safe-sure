import type { Metadata } from "next";
import ResultsExperience from "@/components/ResultsExperience";
import "./results.css";

export const metadata: Metadata = {
  title: "Security agent findings | Secuvora",
  description: "Full application security report: risk summary, evidence, affected locations, practical fixes and check coverage.",
  robots: { index: false, follow: false },
};

export default function ResultsPage() {
  return <ResultsExperience />;
}
