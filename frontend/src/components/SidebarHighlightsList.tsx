import * as React from "react";
import { SidebarHighlight } from "./SidebarHighlight";
import { useLanguage } from "../contexts/LanguageContext";
import { t } from "../translations";
import type { IFGRule, SecuredactHighlight } from "../types/highlights";

interface Props {
  highlights: Array<SecuredactHighlight>;
  resetHighlights: () => void;
  onDeleteHighlight?: (id: string) => void;
  updateHighlightRule: (
    highlight: SecuredactHighlight,
    rule: IFGRule | undefined
  ) => void;
  updateHash: (highlight: SecuredactHighlight) => void;
  rules: IFGRule[];
}

export function SidebarHighlightsList({
  highlights,
  resetHighlights,
  onDeleteHighlight,
  updateHighlightRule,
  updateHash,
  rules,
}: Props) {
  const { language } = useLanguage();
  const sortedHighlights = [...highlights].sort((a, b) => {
    if (a.position.pageNumber !== b.position.pageNumber) {
      return a.position.pageNumber - b.position.pageNumber;
    }
    return a.position.boundingRect.y1 - b.position.boundingRect.y1;
  });

  if (highlights.length === 0) {
    return null;
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.5rem",
        }}
      >
        <div style={{ fontWeight: 600, color: "#1e293b" }}>
          {t(language, "redactions.title")}
        </div>
        <button
          onClick={resetHighlights}
          style={{
            background: "none",
            border: "none",
            padding: "0.4rem 0.6rem",
            fontSize: "0.75rem",
            color: "#64748b",
            cursor: "pointer",
            borderRadius: "4px",
          }}
        >
          {t(language, "redactions.resetAll")}
        </button>
      </div>

      <ul
        className="sidebar__highlights"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          margin: 0,
          padding: 0,
        }}
      >
        {sortedHighlights.map((highlight, index) => {
          const showPageNumber =
            index === 0 ||
            highlight.position.pageNumber !==
              sortedHighlights[index - 1].position.pageNumber;

          return (
            <React.Fragment key={highlight.id}>
              {showPageNumber && (
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "#94a3b8",
                    padding: "0.1rem 0",
                    marginTop: index === 0 ? "0" : "0.25rem",
                  }}
                >
                  Page {highlight.position.pageNumber}
                </div>
              )}
              <SidebarHighlight
                highlight={highlight}
                onDeleteHighlight={onDeleteHighlight}
                updateHighlightRule={updateHighlightRule}
                updateHash={updateHash}
                rules={rules}
              />
            </React.Fragment>
          );
        })}
      </ul>
    </>
  );
}
