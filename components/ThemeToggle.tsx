"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

function readTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function applyTheme(next: Theme) {
  document.documentElement.dataset.theme = next;
  try { window.localStorage.setItem("secuvora:theme", next); } catch {}
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = next === "dark" ? "#090d14" : "#fcfdff";
  window.dispatchEvent(new CustomEvent("secuvora-theme-change", { detail: next }));
}

export default function ThemeToggle({ variant = "icon" }: { variant?: "icon" | "menu" }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTheme(readTheme());
    const sync = (event: Event) => {
      const custom = event as CustomEvent<Theme>;
      setTheme(custom.detail === "dark" ? "dark" : readTheme());
    };
    const storage = (event: StorageEvent) => {
      if (event.key === "secuvora:theme") setTheme(event.newValue === "dark" ? "dark" : "light");
    };
    window.addEventListener("secuvora-theme-change", sync);
    window.addEventListener("storage", storage);
    return () => {
      window.removeEventListener("secuvora-theme-change", sync);
      window.removeEventListener("storage", storage);
    };
  }, []);

  const dark = mounted && theme === "dark";
  const label = dark ? "Switch to light mode" : "Switch to dark mode";

  if (variant === "menu") {
    return (
      <button
        type="button"
        className="theme-menu-row"
        onClick={() => { const next = dark ? "light" : "dark"; setTheme(next); applyTheme(next); }}
        aria-pressed={dark}
        aria-label={label}
      >
        <span className="theme-menu-copy">
          <span className="theme-menu-icon" aria-hidden="true">
            {dark ? <Moon size={17}/> : <Sun size={17}/>}
          </span>
          <span><strong>Appearance</strong><small>{dark ? "Dark mode" : "Light mode"}</small></span>
        </span>
        <span className="theme-switch" aria-hidden="true"><span /></span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className="theme-icon-toggle"
      onClick={() => { const next = dark ? "light" : "dark"; setTheme(next); applyTheme(next); }}
      aria-pressed={dark}
      aria-label={label}
      title={dark ? "Light mode" : "Dark mode"}
    >
      {dark ? <Sun size={17}/> : <Moon size={17}/>}
    </button>
  );
}
