"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import SecuritySection from "@/components/SecuritySection";
import PricingSection from "@/components/PricingSection";
import FaqSection from "@/components/FaqSection";
import Footer from "@/components/Footer";
import AssessmentDialog from "@/components/AssessmentDialog";
import ReportExperience from "@/components/ReportExperience";
import ValueSection from "@/components/ValueSection";
import ScrollProgress from "@/components/ScrollProgress";
import LandingScrollReset from "@/components/LandingScrollReset";
import FinalCTA from "@/components/FinalCTA";

export default function Home() {
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const reveals = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window && !prefersReducedMotion) {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
              observer.unobserve(entry.target);
            }
          }
        },
        { threshold: 0.12, rootMargin: "0px 0px -25px 0px" }
      );
      reveals.forEach((node) => observer.observe(node));

      return () => {
        reveals.forEach((node) => observer.unobserve(node));
      };
    } else {
      reveals.forEach((node) => node.classList.add("visible"));
    }
  }, []);

  return (
    <>
      <LandingScrollReset />
      <ScrollProgress />
      <Header onOpenAssessment={() => setIsAssessmentOpen(true)} />
      <main id="main">
        <Hero onOpenAssessment={() => setIsAssessmentOpen(true)} />
        <div className="container">
          <div className="divider"></div>
        </div>
        <HowItWorks />
        <ValueSection />
        <ReportExperience onOpenAssessment={() => setIsAssessmentOpen(true)} />
        <SecuritySection />
        <PricingSection onOpenAssessment={() => setIsAssessmentOpen(true)} />
        <FaqSection />
        <FinalCTA onOpenAssessment={() => setIsAssessmentOpen(true)} />
      </main>
      <Footer onOpenAssessment={() => setIsAssessmentOpen(true)} />
      <AssessmentDialog
        isOpen={isAssessmentOpen}
        onClose={() => setIsAssessmentOpen(false)}
      />
    </>
  );
}
