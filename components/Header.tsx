"use client";

import { useEffect, useState, useRef } from "react";

interface HeaderProps {
  onOpenAssessment: () => void;
}

export default function Header({ onOpenAssessment }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const mql = window.matchMedia("(min-width: 851px)");
    const handleBreakpoint = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("click", handleClickOutside);
    mql.addEventListener?.("change", handleBreakpoint);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("click", handleClickOutside);
      mql.removeEventListener?.("change", handleBreakpoint);
    };
  }, []);

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleAssessmentClick = (e: React.MouseEvent) => {
    e.preventDefault();
    closeMenu();
    onOpenAssessment();
  };

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header
        ref={headerRef}
        className={`header ${isScrolled ? "scrolled" : ""}`}
        id="top"
      >
        <div className="container header-inner">
          <a href="#top" className="brand" aria-label="ShipSafe home">
            shipsafe<span>.</span>
          </a>
          <nav className="desktop-nav" aria-label="Main navigation">
            <a href="#how">How it works</a>
            <a href="#security">Security</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </nav>
          <a
            href="#assessment"
            onClick={handleAssessmentClick}
            data-start
            className="button button-dark top-cta"
          >
            Assess your application <span aria-hidden="true">↗</span>
          </a>
          <button
            id="menu-toggle"
            className="menu-toggle"
            type="button"
            aria-label={isMenuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <i></i>
            <i></i>
            <i></i>
          </button>
        </div>
        <nav
          id="mobile-nav"
          className="mobile-nav"
          aria-label="Mobile navigation"
          inert={!isMenuOpen}
          style={isMenuOpen ? { display: "flex" } : undefined}
        >
          <a href="#how" onClick={closeMenu}>
            How it works
          </a>
          <a href="#security" onClick={closeMenu}>
            Security
          </a>
          <a href="#pricing" onClick={closeMenu}>
            Pricing
          </a>
          <a href="#faq" onClick={closeMenu}>
            FAQ
          </a>
          <a
            href="#assessment"
            onClick={handleAssessmentClick}
            data-start
            className="button button-dark"
          >
            Assess your application <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>
    </>
  );
}
