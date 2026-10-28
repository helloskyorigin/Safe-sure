import type { Metadata } from "next";
import AssessmentStart from "@/components/AssessmentStart";
import "./assess.css";

export const metadata: Metadata = {
  title: "Run your security agent | Secuvora",
  description: "Start your Secuvora security agent on a public GitHub repository, or authorize private source access when configured. Get evidence-backed findings, free.",
  robots: { index: false, follow: true },
};

export default function AssessPage() {
  return <AssessmentStart />;
}
