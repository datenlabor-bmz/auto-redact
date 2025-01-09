import * as React from "react";
import { downloadPdf } from "../actions/download";
import { useLanguage } from "../contexts/LanguageContext";
import { t } from "../translations";
import type { SecuredactHighlight } from "../types/highlights";

interface Props {
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  variant?: "full" | "compact";
  currentFileName?: string;
  currentPdfFile: File | null;
  highlights: Array<SecuredactHighlight>;
}

export function FileUpload({
  onFileUpload,
  currentFileName,
  currentPdfFile,
  highlights,
}: Props) {
  const { language } = useLanguage();
  const [showOptions, setShowOptions] = React.useState(false);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".download-dropdown")) {
        setShowOptions(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          padding: "1rem",
          backgroundColor: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
      >
        <input
          type="file"
          accept=".pdf"
          onChange={onFileUpload}
          style={{ display: "none" }}
        />
        <span style={{ fontSize: "1.25rem", flexShrink: 0 }}>📄</span>
        <div
          style={{
            flex: 1,
            minWidth: 0,
          }}
        >
          {currentFileName ? (
            <>
              <div
                style={{
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={currentFileName}
              >
                {currentFileName}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#888",
                  whiteSpace: "nowrap",
                }}
              >
                {t(language, "fileUpload.changeDocument")}
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                {t(language, "fileUpload.title")}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#888",
                  whiteSpace: "nowrap",
                }}
              >
                {t(language, "fileUpload.subtitle")}
              </div>
            </>
          )}
        </div>
      </label>

      {currentPdfFile && highlights.length > 0 && (
        <div className="download-dropdown">
          <button
            className="download-trigger"
            onClick={(e) => {
              e.stopPropagation();
              setShowOptions(!showOptions);
            }}
          >
            <span>Save document...</span>
            <span style={{ fontSize: "0.8rem" }}>▾</span>
          </button>
          <div className={`download-options ${showOptions ? "show" : ""}`}>
            <button
              className="download-option"
              onClick={() => {
                downloadPdf(currentPdfFile, highlights, true);
                setShowOptions(false);
              }}
            >
              <span>🟨</span>
              {t(language, "fileUpload.downloadDraft")}
            </button>
            <button
              className="download-option"
              onClick={() => {
                downloadPdf(currentPdfFile, highlights, false);
                setShowOptions(false);
              }}
            >
              <span>⬛️</span>
              {t(language, "fileUpload.downloadRedacted")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
