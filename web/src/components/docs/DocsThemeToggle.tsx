"use client";

import { useEffect, useState } from "react";

const KEY = "tracer-docs-theme";

/** Light/dark toggle for docs. Default matches app night theme (dark). */
export function DocsThemeToggle() {
  const [light, setLight] = useState<boolean | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const root = document.getElementById("docs-root");
      setLight(root?.getAttribute("data-docs-theme") === "light");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const toggle = () => {
    const next = !light;
    setLight(next);
    const root = document.getElementById("docs-root");
    if (root) {
      if (next) root.setAttribute("data-docs-theme", "light");
      else root.removeAttribute("data-docs-theme");
    }
    try {
      localStorage.setItem(KEY, next ? "light" : "dark");
    } catch {
      /* storage unavailable */
    }
  };

  return (
    <button type="button" className="docs-icon-btn" onClick={toggle} aria-label={light ? "Switch to night theme" : "Switch to light theme"} title="Toggle docs theme">
      {light ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
        </svg>
      )}
    </button>
  );
}
