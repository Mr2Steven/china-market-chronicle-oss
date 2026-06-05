"use client";

import { useEffect, useState } from "react";
import { HOME_NAV_SECTIONS } from "@/lib/homePanels";

export default function SideNav() {
  const [active, setActive] = useState<string>(HOME_NAV_SECTIONS[0].anchor);

  useEffect(() => {
    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visible.set(entry.target.id, entry.intersectionRatio);
          } else {
            visible.delete(entry.target.id);
          }
        });

        const next = HOME_NAV_SECTIONS.find(({ anchor }) => visible.has(anchor))?.anchor;
        if (next) setActive(next);
      },
      { rootMargin: "-24% 0px -62% 0px", threshold: [0, 0.1, 0.25] }
    );

    HOME_NAV_SECTIONS.forEach(({ anchor }) => {
      const el = document.getElementById(anchor);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (anchor: string) => {
    document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="toc-nav" aria-label="章节导航">
      {HOME_NAV_SECTIONS.map(({ label, anchor }) => {
        const isActive = active === anchor;
        return (
          <button
            key={anchor}
            className={isActive ? "toc-nav__item toc-nav__item--active" : "toc-nav__item"}
            onClick={() => scrollTo(anchor)}
            aria-current={isActive ? "true" : undefined}
            title={label}
          >
            <span className="toc-nav__rule" />
            <span className="toc-nav__label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
