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
        <div className="pricing-intro reveal visible">
          <p className="eyebrow">FULL ACCESS, NO PAYWALL</p>
          <h2>
            All the detail,
            <br />
            nothing hidden.
          </h2>
          <p>
            Explore every finding, its source location, supporting evidence and
            recommended fixes together—without locked report sections.
          </p>
          <div className="no-renew">
            <span>✓</span> Full results included. No checkout.
          </div>
        </div>

        <div className="price-card reveal visible">
          <div className="price-top">
            <div>
              <small>COMPLETE SECURITY REPORT</small>
              <h3>See the full picture</h3>
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
            Assess your application <span aria-hidden="true">→</span>
          </a>
          <p className="price-caption">
            Full report access is planned to be free. Scanning is not live yet.
          </p>
        </div>
      </div>
    </section>
  );
}
