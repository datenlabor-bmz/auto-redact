import * as React from "react";
import { COLORS } from "../style/theme";

interface Props {
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  variant?: "full" | "compact";
  currentFileName?: string;
}

export function FileUpload({ onFileUpload, currentFileName }: Props) {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          position: "relative",
          padding: "0.75rem",
          backgroundColor: isHovered ? COLORS.primary.light : COLORS.neutral.white,
          borderRadius: "8px",
          border: `2px dashed ${isHovered ? COLORS.primary.main : COLORS.primary.light}`,
          cursor: "pointer",
          transition: "all 0.2s ease",
          marginBottom: "1rem",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <input
          id="pdf-upload"
          type="file"
          accept="application/pdf"
          onChange={onFileUpload}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            opacity: 0,
            cursor: "pointer",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            color: COLORS.neutral.text.secondary,
          }}
        >
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
                  Click to change document
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
                  Upload PDF Document
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#888",
                    whiteSpace: "nowrap",
                  }}
                >
                  or drop file here
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
