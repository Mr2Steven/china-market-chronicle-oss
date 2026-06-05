"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark]);

  function toggle() {
    const next = !dark;
    setDark(next);
    const theme = next ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }

  return (
    <button
      onClick={toggle}
      aria-label="切换主题"
      style={{
        background: "none",
        border: "1px solid var(--border)",
        borderRadius: 4,
        padding: "4px 10px",
        cursor: "pointer",
        color: "var(--text-muted)",
        fontFamily: "var(--font-mono)",
        fontSize: 12,
      }}
    >
      <span suppressHydrationWarning>{dark ? "☀ 亮色" : "☾ 暗色"}</span>
    </button>
  );
}
