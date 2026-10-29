"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Moon, Sun } from "lucide-react";

interface HeaderProps {
  onOpenAssessment: () => void;
}

export default function Header({ onOpenAssessment }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    document.body.classList.add("landing-theme-active");
    const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    setTheme(current);
    return () => document.body.classList.remove("landing-theme-active");
  }, []);

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

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try { window.localStorage.setItem("secuvora:theme", next); } catch {}
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) meta.content = next === "dark" ? "#090d14" : "#fcfdff";
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
          <a href="#top" className="brand" aria-label="Secuvora home">
            secuvora<span>.</span>
          </a>
          <nav className="desktop-nav" aria-label="Main navigation">
            <a href="#product">Agent report</a>
            <a href="#how">How it works</a>
            <a href="#security">Security</a>
            <a href="#pricing">Full report</a>
            <a href="#faq">FAQ</a>
            <Link href="/assess/history">Agent history</Link>
          </nav>
          <a
            href="/assess"
            onClick={handleAssessmentClick}
            data-start
            className="button button-dark top-cta"
          >
            Start investigation <span aria-hidden="true">↗</span>
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
          <a href="#product" onClick={closeMenu}>Agent report</a>
          <a href="#how" onClick={closeMenu}>
            How it works
          </a>
          <a href="#security" onClick={closeMenu}>
            Security
          </a>
          <a href="#pricing" onClick={closeMenu}>
            Full report
          </a>
          <a href="#faq" onClick={closeMenu}>
            FAQ
          </a>
          <Link href="/assess/history" onClick={closeMenu}>Agent history</Link>
          <button
            type="button"
            className="theme-menu-row"
            onClick={toggleTheme}
            aria-pressed={theme === "dark"}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            <span className="theme-menu-copy">
              <span className="theme-menu-icon" aria-hidden="true">
                {theme === "dark" ? <Moon size={17}/> : <Sun size={17}/>}
              </span>
              <span><strong>Appearance</strong><small>{theme === "dark" ? "Dark mode" : "Light mode"}</small></span>
            </span>
            <span className="theme-switch" aria-hidden="true"><span /></span>
          </button>
          <a
            href="/assess"
            onClick={handleAssessmentClick}
            data-start
            className="button button-dark"
          >
            Start investigation <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>
    </>
  );
}
