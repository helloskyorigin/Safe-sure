export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer-main">
        <div>
          <a href="#top" className="brand">
            shipsafe<span>.</span>
          </a>
          <p>Know the risks before you ship.</p>
        </div>
        <nav aria-label="Footer navigation">
          <a href="#how">How it works</a>
          <a href="#security">Security</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </nav>
      </div>
      <div className="container copyright">
        © <span id="year">{currentYear}</span> ShipSafe. Application security, made clear.
      </div>
    </footer>
  );
}
