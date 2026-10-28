export default function HowItWorks() {
  return (
    <section id="how" className="section">
      <div className="container">
        <div className="section-heading reveal visible">
          <p className="eyebrow">THE PROCESS</p>
          <h2>How ShipSafe works</h2>
          <p>From assessment to clarity in three simple steps.</p>
        </div>
        <div className="steps">
          <article className="step reveal visible">
            <div className="step-head">
              <div className="step-icon">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="m10 13 4-4m-7 9-1 1a4 4 0 0 1-5.6-5.6l5-5a4 4 0 0 1 5.6 0m2 0 1-1a4 4 0 0 1 5.6 5.6l-5 5a4 4 0 0 1-5.6 0"
                    transform="translate(2 -1)"
                  />
                </svg>
              </div>
              <span>01</span>
            </div>
            <h3>Connect application</h3>
            <p>
              Choose the application you want assessed. Source access is read-only,
              with no code changes.
            </p>
          </article>
          <article className="step reveal visible">
            <div className="step-head">
              <div className="step-icon">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="5" y="3" width="14" height="18" rx="2" />
                  <path d="M9 8h6M9 12h6M9 16h4" />
                </svg>
              </div>
              <span>02</span>
            </div>
            <h3>Review findings</h3>
            <p>
              See critical, high, medium and low
              security issues.
            </p>
          </article>
          <article className="step reveal visible">
            <div className="step-head">
              <div className="step-icon">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="5" y="10" width="14" height="11" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" />
                </svg>
              </div>
              <span>03</span>
            </div>
            <h3>Understand and resolve</h3>
            <p>
              Access affected files, supporting evidence, impact and actionable
              fix guidance in the same full report.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
