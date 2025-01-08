import * as React from "react";

interface PromptInputProps {
  customPrompt: string;
  setCustomPrompt: (prompt: string) => void;
  onAnalyzePdf: () => void;
  isAnalyzing: boolean;
}

const adjustTextareaHeight = (element: HTMLTextAreaElement) => {
  element.style.height = "auto";
  element.style.height = `${element.scrollHeight}px`;
};

export function PromptInput({
  customPrompt,
  setCustomPrompt,
  onAnalyzePdf,
  isAnalyzing,
}: PromptInputProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Adjust height whenever customPrompt changes or on mount
  React.useEffect(() => {
    if (textareaRef.current) {
      adjustTextareaHeight(textareaRef.current);
    }
  }, [customPrompt]);

  return (
    <div style={{ marginBottom: "1rem" }}>
      <label
        htmlFor="prompt-input"
        style={{
          display: "block",
          marginBottom: "0.5rem",
          color: "#1e293b",
          fontSize: "0.9rem",
          fontWeight: "600",
        }}
      >
        AI Redaction Prompt:
      </label>
      <textarea
        ref={textareaRef}
        id="prompt-input"
        value={customPrompt}
        onChange={(e) => {
          setCustomPrompt(e.target.value);
          adjustTextareaHeight(e.target);
        }}
        onFocus={(e) => adjustTextareaHeight(e.target)}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            if (!isAnalyzing) {
              onAnalyzePdf();
            }
          }
        }}
        style={{
          width: "100%",
          minHeight: "70px",
          marginBottom: "0.5rem",
          padding: "0.75rem",
          fontSize: "0.85rem",
          fontFamily: "Monaco, Consolas, 'Courier New', monospace",
          lineHeight: "1.4",
          border: "1px solid #e2e8f0",
          borderRadius: "6px",
          resize: "none",
          boxSizing: "border-box",
          overflow: "hidden",
          backgroundColor: "#fff",
          color: "#1e293b",
        }}
      />
      <button
        onClick={onAnalyzePdf}
        disabled={isAnalyzing}
        style={{
          width: "100%",
          padding: "0.75rem",
          fontSize: "0.9rem",
          fontWeight: "500",
          color: "#fff",
          backgroundColor: "#3b82f6",
          border: "none",
          borderRadius: "6px",
          cursor: isAnalyzing ? "not-allowed" : "pointer",
          opacity: isAnalyzing ? 0.7 : 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          transition: "all 0.2s ease",
        }}
      >
        {isAnalyzing ? (
          <>
            <div className="spinner-small" />
            Analyzing PDF...
          </>
        ) : (
          "Get AI Redactions"
        )}
      </button>
    </div>
  );
}
