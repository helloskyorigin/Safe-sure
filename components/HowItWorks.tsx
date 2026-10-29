export default function HowItWorks() {
  return (
    <section id="how" className="section">
      <div className="container">
        <div className="section-heading ">
          <p className="eyebrow">THE INVESTIGATION WORKFLOW</p>
          <h2>From signal to evidence to action.</h2>
          <p>A structured workflow for investigating the security signals Secuvora can verify today.</p>
        </div>
        <div className="steps">
          <article className="step ">
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
            <h3>Choose an authorized source</h3>
            <p>
              Select a public GitHub repository. Private access requires a configured, read-only GitHub connection.
            </p>
          </article>
          <article className="step ">
            <div className="step-head">
              <div className="step-icon">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="5" y="3" width="14" height="18" rx="2" />
                  <path d="M9 8h6M9 12h6M9 16h4" />
                </svg>
              </div>
              <span>02</span>
            </div>
            <h3>Run bounded checks</h3>
            <p>
              Inspect supported secret and configuration patterns, then match pinned dependencies to published OSV advisories.
            </p>
          </article>
          <article className="step ">
            <div className="step-head">
              <div className="step-icon">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="5" y="10" width="14" height="11" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" />
                </svg>
              </div>
              <span>03</span>
            </div>
            <h3>Review evidence and respond</h3>
            <p>
              Review affected files, supporting evidence, risk context and actionable
              fix guidance in the same full report.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
