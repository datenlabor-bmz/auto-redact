import * as React from "react";
import { IFGRuleSelector } from "./IFGRuleSelector";
import type { IFGRule, SecuredactHighlight } from "../types/highlights";

interface Props {
  highlight: SecuredactHighlight;
  onDeleteHighlight?: (id: string) => void;
  updateHighlightRule: (
    highlight: SecuredactHighlight,
    rule: IFGRule | undefined
  ) => void;
  updateHash: (highlight: SecuredactHighlight) => void;
  rules: IFGRule[];
}

export function SidebarHighlight({
  highlight,
  onDeleteHighlight,
  updateHighlightRule,
  updateHash,
  rules,
}: Props) {
  return (
    <li
      className="sidebar__highlight"
      style={{
        padding: "0.75rem",
        backgroundColor: "#f0f9ff",
        borderRadius: "6px",
        border: "1px solid #bfdbfe",
        position: "relative",
      }}
    >
      <div style={{ cursor: "pointer" }} onClick={() => updateHash(highlight)}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteHighlight?.(highlight.id);
              }}
              style={{
                position: "absolute",
                top: "0.5rem",
                right: "0.5rem",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "1.1rem",
                padding: "0.35rem 0.5rem",
                color: "#94a3b8",
                lineHeight: 1,
                borderRadius: "4px",
                transition: "background-color 0.2s ease",
                zIndex: 1,
                marginBottom: "1rem",
              }}
              title="Remove redaction"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              ×
            </button>
            {highlight.content.text && (
              <blockquote
                style={{
                  flex: 1,
                  margin: 0,
                  fontSize: "0.85rem",
                  lineHeight: "1.4",
                  color: "#334155",
                }}
              >
                {highlight.content.text.length > 60
                  ? `${highlight.content.text.slice(0, 60).trim()}…`
                  : highlight.content.text.trim()}
              </blockquote>
            )}
            {highlight.content.image ? (
              <div className="highlight__image" style={{ marginTop: "2rem" }}>
                <img
                  src={highlight.content.image}
                  alt={"Screenshot"}
                  style={{
                    maxWidth: "calc(100% - 2px)",
                    height: "auto",
                    display: "block",
                    border: "1px dashed",
                  }}
                />
              </div>
            ) : null}
          </div>
        </div>
        <IFGRuleSelector
          rules={rules}
          selectedRule={highlight.ifgRule}
          onSelectRule={(rule) => updateHighlightRule(highlight, rule)}
        />
      </div>
    </li>
  );
}
