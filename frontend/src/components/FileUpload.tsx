import * as React from "react";
import { COLORS } from "../style/theme";
import { useLanguage } from "../contexts/LanguageContext";
import { t } from "../translations";

interface Props {
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  variant?: "full" | "compact";
  currentFileName?: string;
}

export function FileUpload({ onFileUpload, currentFileName }: Props) {
  const { language } = useLanguage();
  
  return (
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
  );
}
