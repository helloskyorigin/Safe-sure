"use client";

import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import SecuritySection from "@/components/SecuritySection";
import PricingSection from "@/components/PricingSection";
import FaqSection from "@/components/FaqSection";
import Footer from "@/components/Footer";
import ReportExperience from "@/components/ReportExperience";
import ValueSection from "@/components/ValueSection";
import ScrollProgress from "@/components/ScrollProgress";
import LandingScrollReset from "@/components/LandingScrollReset";
import LandingMotionDirector from "@/components/LandingMotionDirector";
import FinalCTA from "@/components/FinalCTA";

export default function Home() {
  const router = useRouter();
  const openAssessment = () => router.push("/assess");



  return (
    <div className="landing-page">
      <LandingScrollReset />
      <LandingMotionDirector />
      <ScrollProgress />
      <Header onOpenAssessment={openAssessment} />
      <main id="main">
        <Hero onOpenAssessment={openAssessment} />
        <div className="container">
          <div className="divider"></div>
        </div>
        <HowItWorks />
        <ValueSection />
        <ReportExperience onOpenAssessment={openAssessment} />
        <SecuritySection />
        <PricingSection onOpenAssessment={openAssessment} />
        <FaqSection />
        <FinalCTA onOpenAssessment={openAssessment} />
      </main>
      <Footer onOpenAssessment={openAssessment} />
    </div>
  );
}
