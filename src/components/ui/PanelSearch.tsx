"use client";

import { useMemo, useState } from "react";
import { HOME_PANEL_ANCHORS } from "@/lib/homePanels";
import { PANELS, SECTIONS, type PanelDef } from "@/lib/panelRegistry";

type SearchPanel = PanelDef & {
  sectionLabel: string;
  anchor: string;
  haystack: string;
};

const SEARCH_PANELS: SearchPanel[] = PANELS.map((panel) => {
  const section = SECTIONS.find((item) => item.id === panel.section);
  return {
    ...panel,
    sectionLabel: section ? `§ ${section.index} ${section.title}` : panel.section,
    anchor: HOME_PANEL_ANCHORS[panel.id] ?? `panel-${panel.id}`,
    haystack: [
      panel.title,
      panel.titleEn,
      panel.description,
      panel.keywords.join(" "),
    ].join(" ").toLowerCase(),
  };
});

function normalize(input: string): string {
  return input.trim().toLowerCase();
}

export default function PanelSearch() {
  const [query, setQuery] = useState("");
  const normalizedQuery = normalize(query);
  const active = normalizedQuery.length > 0;

  const results = useMemo(() => {
    if (!normalizedQuery) return [];
    return SEARCH_PANELS.filter((panel) => panel.haystack.includes(normalizedQuery));
  }, [normalizedQuery]);

  function jumpToPanel(anchor: string) {
    setQuery("");
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  return (
    <div className={`panel-search${active ? " panel-search--active" : ""}`}>
      <style jsx>{`
        .panel-search {
          max-width: 480px;
          margin: 0 auto 48px;
          position: relative;
          z-index: 2;
        }

        .panel-search--active + .home-sections {
          display: none;
        }

        .panel-search__input {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg-panel);
          color: var(--text);
          font-family: var(--font-mono);
          font-size: 14px;
          line-height: 1.4;
          padding: 13px 15px;
          outline: none;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
        }

        .panel-search__input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 14%, transparent);
        }

        .panel-search__results {
          margin-top: 10px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: color-mix(in srgb, var(--bg-panel) 96%, var(--bg));
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.08);
          overflow: hidden;
        }

        .panel-search__empty {
          padding: 18px 16px;
          font-family: var(--font-mono);
          font-size: 13px;
          color: var(--text-muted);
          text-align: center;
        }

        .panel-search__result {
          width: 100%;
          border: 0;
          border-bottom: 1px solid var(--border);
          background: transparent;
          color: var(--text);
          cursor: pointer;
          display: block;
          padding: 13px 15px;
          text-align: left;
        }

        .panel-search__result:last-child {
          border-bottom: 0;
        }

        .panel-search__result:hover,
        .panel-search__result:focus {
          background: var(--bg-muted);
          outline: none;
        }

        .panel-search__title {
          display: block;
          font-size: 14px;
          font-weight: 600;
          line-height: 1.35;
          color: var(--text-heading);
        }

        .panel-search__section {
          display: block;
          margin-top: 4px;
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--text-muted);
        }

        @media (max-width: 640px) {
          .panel-search {
            width: calc(100% - 32px);
            max-width: calc(100% - 32px);
            margin: 0 auto 32px;
          }

          .panel-search__input {
            font-size: 13px;
            padding: 12px 13px;
          }
        }
      `}</style>

      <input
        className="panel-search__input"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setQuery("");
            event.currentTarget.blur();
          }
        }}
        placeholder="搜索面板…  例如：PE、融资、黄金"
        aria-label="搜索面板"
      />

      {active && (
        <div className="panel-search__results" role="listbox" aria-label="搜索结果">
          {results.length === 0 ? (
            <div className="panel-search__empty">未找到匹配面板</div>
          ) : (
            results.map((panel) => (
              <button
                key={panel.id}
                className="panel-search__result"
                type="button"
                onClick={() => jumpToPanel(panel.anchor)}
              >
                <span className="panel-search__title">{panel.title}</span>
                <span className="panel-search__section">{panel.sectionLabel}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
