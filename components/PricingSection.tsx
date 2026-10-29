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
          <p className="eyebrow">AVAILABLE NOW</p>
          <h2>
            The full investigation,
            <br />
            without a paywall.
          </h2>
          <p>
            Every available candidate finding includes source evidence, context and practical steps for review.
          </p>
          <div className="no-renew">
            <span>✓</span> Full results included. No checkout.
          </div>
        </div>

        <div className="price-card ">
          <div className="price-top">
            <div>
              <small>COMPLETE PUBLIC REVIEW</small>
              <h3>Public-source investigations</h3>
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
            Start an investigation <span aria-hidden="true">→</span>
          </a>
          <p className="price-caption">
            Start with a public GitHub source. Private repositories require configured, explicit authorization.
          </p>
        </div>
      </div>
    </section>
  );
}
