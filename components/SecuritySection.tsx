export default function SecuritySection() {
  return (
    <section id="security" className="section bordered">
      <div className="container">
        <div className="split-heading ">
          <div>
            <p className="eyebrow">SECURITY BY DESIGN</p>
            <h2>
              Built for trust
              <br />
              from the first click.
            </h2>
          </div>
          <p>
            Your code is sensitive. Secuvora&apos;s approach emphasizes transparent
            access, understandable evidence and responsible assessment.
          </p>
        </div>
        <div className="trust-grid">
          <article className="trust-item ">
            <div className="trust-icon">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 2 3 6v6c0 5 3.4 8 9 10 5.6-2 9-5 9-10V6l-9-4Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <h3>Read-only access</h3>
            <p>
              Only selected source needs to be read. Secuvora does not need permission
              to modify your code.
            </p>
          </article>
          <article className="trust-item ">
            <div className="trust-icon">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8l-5-5H8Z" />
                <path d="M15 3v6h6M7 13h10M7 17h7" />
              </svg>
            </div>
            <h3>Evidence-backed findings</h3>
            <p>
              Review the basis for each potential issue rather than relying on
              unexplained security scores.
            </p>
          </article>
          <article className="trust-item ">
            <div className="trust-icon">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="5" y="10" width="14" height="11" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" />
              </svg>
            </div>
            <h3>Clear scope and limits</h3>
            <p>
              No automated agent can guarantee a secure application. We distinguish actual
              findings from further review.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
