import type { IHighlight } from "react-pdf-highlighter";
import React, { useState } from "react";
import { FileUpload } from "./components/FileUpload";
import { PromptInput } from "./components/PromptInput";

interface Props {
  highlights: Array<IHighlight>;
  resetHighlights: () => void;
  toggleDocument: () => void;
  onFileUpload: (fileUrl: string, file: File) => void;
  onDeleteHighlight?: (id: string) => void;
  onBackendHighlights: (highlights: Array<IHighlight>) => void;
  currentPdfFile: File | null;
  customPrompt: string;
  setCustomPrompt: (prompt: string) => void;
  onAnalyzePdf: () => void;
  isAnalyzing: boolean;
}

const updateHash = (highlight: IHighlight) => {
  document.location.hash = `highlight-${highlight.id}`;
};

export function Sidebar({
  highlights,
  resetHighlights,
  onFileUpload,
  onDeleteHighlight,
  onBackendHighlights,
  currentPdfFile,
  customPrompt,
  setCustomPrompt,
  onAnalyzePdf,
  isAnalyzing,
}: Props) {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      onFileUpload(fileUrl, file);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/analyze-pdf", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to analyze PDF");
        }

        const analysisResult = await response.json();
        const convertedHighlights = Object.entries(analysisResult).flatMap(
          ([pageNum, highlights]: [string, any[]]) =>
            highlights.map((h: any) => {
              return {
                content: {
                  text: h.text || "",
                },
                position: {
                  boundingRect: {
                    x1: h.x0,
                    y1: h.y0,
                    x2: h.x1,
                    y2: h.y1,
                    width: h.page_width,
                    height: h.page_height,
                  },
                  rects: [
                    {
                      x1: h.x0,
                      y1: h.y0,
                      x2: h.x1,
                      y2: h.y1,
                      width: h.page_width,
                      height: h.page_height,
                    },
                  ],
                  pageNumber: parseInt(pageNum),
                },
                comment: { text: "AI Generated", emoji: "🤖" },
                id: String(Math.random()).slice(2),
              };
            })
        );

        onBackendHighlights(convertedHighlights);
      } catch (error) {
        console.error("Error analyzing PDF:", error);
      }
    }
  };

  const sortedHighlights = [...highlights].sort((a, b) => {
    // First sort by page number
    if (a.position.pageNumber !== b.position.pageNumber) {
      return a.position.pageNumber - b.position.pageNumber;
    }

    // If on same page, sort by vertical position (top to bottom)
    return a.position.boundingRect.y1 - b.position.boundingRect.y1;
  });

  const handleSave = async () => {
    if (!currentPdfFile) {
      alert("No PDF file loaded");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", currentPdfFile);

      // Transform highlights back to PyMuPDF coordinate system
      const transformedHighlights = highlights.map((h) => {
        return {
          ...h,
          position: {
            ...h.position,
            boundingRect: {
              ...h.position.boundingRect,
              // Convert back to PyMuPDF coordinates
              y1: h.position.boundingRect.y1,
              y2: h.position.boundingRect.y2,
            },
          },
        };
      });

      formData.append("annotations", JSON.stringify(transformedHighlights));

      const response = await fetch("/api/save-annotations", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to save annotations");
      }

      // Download the annotated PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `annotated_${currentPdfFile.name}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error saving annotations:", error);
      alert("Failed to save annotations");
    }
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
      <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "1.5rem" }}>
        <div style={{
              display: "flex",
              alignItems: "center",
          gap: "0.5rem",
          fontSize: "1.5rem",
          fontWeight: "700",
          color: "#1e293b",
        }}>
          <span>⬛️</span>
          <span style={{ color: "#0f172a" }}>AutoRedact</span>
        </div>
        <div style={{
              fontSize: "0.9rem",
          color: "#3b82f6",
          marginTop: "0.5rem",
        }}>
          AI-assisted document redaction
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <FileUpload
          onFileUpload={handleFileUpload}
          currentFileName={currentPdfFile?.name}
        />

        {currentPdfFile && (
          <>
          <PromptInput
            customPrompt={customPrompt}
            setCustomPrompt={setCustomPrompt}
            onAnalyzePdf={onAnalyzePdf}
            isAnalyzing={isAnalyzing}
          />

          <div style={{
            padding: "1.25rem",
            backgroundColor: "#fff",
            borderRadius: "8px",
            fontSize: "0.85rem",
            color: "#1e293b",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          }}>
            <div style={{ marginBottom: "0.75rem", fontWeight: "600" }}>
              💡 How to create redactions:
            </div>
            <ul style={{
              margin: "0",
              paddingLeft: "1.2rem",
              lineHeight: "1.4",
            }}>
              <li>Select text with your mouse to redact specific content</li>
              <li>Hold Alt and drag to redact rectangular areas</li>
              <li>All highlights will be converted to redactions when saving</li>
            </ul>
          </div>
          </>
        )}

        {highlights.length > 0 && (
          <>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.5rem",
            }}>
              <div style={{ fontWeight: 600, color: "#1e293b" }}>
                Redactions
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
                🗑️ Reset all
          </button>
            </div>

            {currentPdfFile && (
          <button
            onClick={handleSave}
            style={{
              width: "100%",
                  padding: "0.75rem",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                  color: "#1e293b",
                  backgroundColor: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
            }}
          >
            Save Redacted PDF
          </button>
        )}

            <ul className="sidebar__highlights" style={{
              backgroundColor: "#ffffff",
              padding: "1rem",
              borderRadius: "8px",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.06)",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}>
              {sortedHighlights.map((highlight) => (
                <li
                  key={highlight.id}
                  className="sidebar__highlight"
                style={{
                    padding: "0.75rem",
                    backgroundColor: "#f0f9ff",
                    borderRadius: "6px",
                    border: "1px solid #bfdbfe",
                  }}
                >
                  <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "8px",
                  }}>
                <div
                  style={{ flex: 1, cursor: "pointer" }}
                      onClick={() => updateHash(highlight)}
                >
                      <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      gap: "8px",
                      }}>
                        {highlight.content.text && (
                          <blockquote style={{
                            flex: 1,
                            margin: 0,
                            fontSize: "0.85rem",
                            lineHeight: "1.4",
                            color: "#334155",
                          }}>
                        {highlight.content.text.length > 60
                          ? `${highlight.content.text.slice(0, 60).trim()}…`
                          : highlight.content.text.trim()}
                      </blockquote>
                        )}
                        <div style={{
                          whiteSpace: "nowrap",
                          fontSize: "0.75rem",
                          color: "#64748b",
                          fontWeight: "500",
                        }}>
                      Page {highlight.position.pageNumber}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onDeleteHighlight?.(highlight.id)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                        fontSize: "1.1rem",
                    padding: "0 4px",
                        color: "#94a3b8",
                    lineHeight: 1,
                  }}
                  title="Remove redaction"
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
          </>
        )}
        </div>

      <div
        style={{
          paddingTop: "1.5rem",
          borderTop: "1px solid #e2e8f0",
          fontSize: "0.85rem",
          color: "#3b82f6",
          marginTop: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
          }}
        >
          <div
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.4rem 0.6rem",
              borderRadius: "6px",
              cursor: "help",
              position: "relative",
              backgroundColor: showTooltip ? "#f3f4f6" : "transparent",
              transition: "all 0.2s ease",
            }}
          >
            <span style={{ fontSize: "1.2rem" }}>🇩🇪</span>
            <span style={{ fontSize: "1.2rem" }}>🇪🇺</span>
            <span style={{ fontSize: "1.2rem" }}>🇺🇳</span>
            {showTooltip && (
              <div
                style={{
                  position: "absolute",
                  bottom: "calc(100% + 12px)",
                  left: 0,
                  backgroundColor: "white",
                  color: "#374151",
                  padding: "1rem 1.25rem",
                  borderRadius: "12px",
                  fontSize: "0.75rem",
                  lineHeight: "1.5",
                  width: "220px",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.12)",
                  border: "1px solid #e5e7eb",
                  zIndex: 10,
                  animation: "tooltipFade 0.2s ease-out",
                }}
              >
                <div
                  style={{
                    marginBottom: "0.75rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span style={{ fontSize: "1.1rem" }}>🇩🇪</span>
                  Made in Germany
                </div>
                <div
                  style={{
                    marginBottom: "0.75rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span style={{ fontSize: "1.1rem" }}>🇪🇺</span>
                  With European privacy
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span style={{ fontSize: "1.1rem" }}>🇺🇳</span>
                  As a Digital Public Good
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: "-6px",
                    left: "20px",
                    transform: "rotate(45deg)",
                    width: "12px",
                    height: "12px",
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderTop: "none",
                    borderLeft: "none",
                  }}
                />
              </div>
            )}
          </div>

          <a
            href="https://github.com/davidpomerenke/securedact"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              padding: "0.4rem 0.6rem",
              borderRadius: "6px",
              transition: "all 0.2s ease",
              fontSize: "1.2rem",
              color: "#666",
              textDecoration: "none",
              backgroundColor: "transparent",
            }}
          >
            <svg
              height="20"
              width="20"
              viewBox="0 0 16 16"
              style={{ fill: "currentColor" }}
            >
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
