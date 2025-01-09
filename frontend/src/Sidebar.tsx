import * as React from "react";
import { analyzePdf } from "./actions/analyze";
import { uploadPdf } from "./actions/upload";
import { FileUpload } from "./components/FileUpload";
import { IFGRuleSelector } from "./components/IFGRuleSelector";
import { PromptInput } from "./components/PromptInput";
import { RedactionHints } from "./components/RedactionHints";
import { SidebarFooter } from "./components/SidebarFooter";
import { useLanguage } from "./contexts/LanguageContext";
import { t } from "./translations";
import type { IFGRule, SecuredactHighlight } from "./types/highlights";

interface Props {
  highlights: Array<SecuredactHighlight>;
  resetHighlights: () => void;
  toggleDocument: () => void;
  onFileUpload: (fileUrl: string, file: File) => void;
  onDeleteHighlight?: (id: string) => void;
  onBackendHighlights: (highlights: Array<SecuredactHighlight>) => void;
  currentPdfFile: File | null;
  customPrompt: string;
  setCustomPrompt: (prompt: string) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  setHighlights: (highlights: Array<SecuredactHighlight>) => void;
}

const updateHash = (highlight: SecuredactHighlight) => {
  document.location.hash = `highlight-${highlight.id}`;
};

// Load IFG rules from the JSON file
import ifgRulesData from "../../rules/informationsfreiheitsgesetz.json";
const ifgRules: IFGRule[] = ifgRulesData.rules;

export function Sidebar({
  highlights,
  resetHighlights,
  toggleDocument,
  onFileUpload,
  onDeleteHighlight,
  onBackendHighlights,
  currentPdfFile,
  customPrompt,
  setCustomPrompt,
  isAnalyzing,
  setIsAnalyzing,
  setHighlights,
}: Props) {
  const { language } = useLanguage();
  const sortedHighlights = [...highlights].sort((a, b) => {
    if (a.position.pageNumber !== b.position.pageNumber) {
      return a.position.pageNumber - b.position.pageNumber;
    }
    return a.position.boundingRect.y1 - b.position.boundingRect.y1;
  });

  const updateHighlightRule = (
    highlight: SecuredactHighlight,
    rule: IFGRule | undefined
  ) => {
    setHighlights(
      highlights.map((h) =>
        h.id === highlight.id ? { ...h, ifgRule: rule } : h
      )
    );
  };

  return (
    <div
      className="sidebar"
      style={{
        width: "20%",
        minWidth: "250px",
        padding: "2rem",
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
        backgroundColor: "#f8fafc",
        borderRight: "1px solid #e2e8f0",
      }}
    >
      {/* Header */}
      <div
        style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "1.5rem" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "1.5rem",
            fontWeight: "700",
            color: "#1e293b",
            marginBottom: "0.5rem",
          }}
        >
          <span>⬛️</span>
          <span style={{ color: "#0f172a" }}>{t(language, "app.title")}</span>
        </div>
        <div
          style={{
            fontSize: "0.9rem",
            color: "#3b82f6",
          }}
        >
          {t(language, "app.subtitle")}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <FileUpload
          onFileUpload={async (event: React.ChangeEvent<HTMLInputElement>) =>
            uploadPdf(event, onFileUpload, onBackendHighlights)
          }
          currentFileName={currentPdfFile?.name}
          currentPdfFile={currentPdfFile}
          highlights={highlights}
        />

        {currentPdfFile && (
          <>
            <PromptInput
              customPrompt={customPrompt}
              setCustomPrompt={setCustomPrompt}
              onAnalyzePdf={async () =>
                analyzePdf(
                  currentPdfFile,
                  customPrompt,
                  setHighlights,
                  setIsAnalyzing
                )
              }
              isAnalyzing={isAnalyzing}
            />
            <RedactionHints />
          </>
        )}

        {highlights.length > 0 && (
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
                      <div
                        style={{ cursor: "pointer" }}
                        onClick={() => updateHash(highlight)}
                      >
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
                                e.currentTarget.style.backgroundColor =
                                  "rgba(0, 0, 0, 0.05)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "transparent";
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
                              <div
                                className="highlight__image"
                                style={{ marginTop: "2rem" }}
                              >
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
                          rules={ifgRules}
                          selectedRule={highlight.ifgRule}
                          onSelectRule={(rule) =>
                            updateHighlightRule(highlight, rule)
                          }
                        />
                      </div>
                    </li>
                  </React.Fragment>
                );
              })}
            </ul>
          </>
        )}
      </div>

      <SidebarFooter />
    </div>
  );
}
