"use client";

interface PricingSectionProps {
  onOpenAssessment: () => void;
}

export default function PricingSection({ onOpenAssessment }: PricingSectionProps) {
  const handleAssessmentClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onOpenAssessment();
  };

  return (
    <section id="pricing" className="section bordered pricing-section">
      <div className="container pricing-grid">
        <div className="pricing-intro ">
          <p className="eyebrow">FULL ACCESS, NO PAYWALL</p>
          <h2>
            All the detail,
            <br />
            nothing hidden.
          </h2>
          <p>
            Get the whole picture: affected source files, supporting evidence, risk context and step-by-step remediation. Every supported finding stays accessible.
          </p>
          <div className="no-renew">
            <span>✓</span> Full results included. No checkout.
          </div>
        </div>

        <div className="price-card ">
          <div className="price-top">
            <div>
              <small>COMPLETE AGENT REPORT</small>
              <h3>All agent findings. Free.</h3>
            </div>
            <div className="price">
              FREE<span>full report</span>
            </div>
          </div>
          <div className="price-divider"></div>
          <ul className="features">
            <li>
              <span>✓</span> Exact affected files
            </li>
            <li>
              <span>✓</span> Why it matters
            </li>
            <li>
              <span>✓</span> Step-by-step guidance
            </li>
            <li>
              <span>✓</span> Potential impact
            </li>
          </ul>
          <a
            href="/assess"
            onClick={handleAssessmentClick}
            data-start
            className="button button-dark price-cta"
          >
            Scan a public repository <span aria-hidden="true">→</span>
          </a>
          <p className="price-caption">
            Public repository agent analysis is available now. Private GitHub access requires configured authorization.
          </p>
        </div>
      </div>
    </section>
  );
}
