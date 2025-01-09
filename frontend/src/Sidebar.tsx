import * as React from "react";
import { analyzePdf } from "./actions/analyze";
import { uploadPdf } from "./actions/upload";
import { FileUpload } from "./components/FileUpload";
import { PromptInput } from "./components/PromptInput";
import { RedactionHints } from "./components/RedactionHints";
import { SidebarFooter } from "./components/SidebarFooter";
import { SidebarHighlightsList } from "./components/SidebarHighlightsList";
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

        <SidebarHighlightsList
          highlights={highlights}
          resetHighlights={resetHighlights}
          onDeleteHighlight={onDeleteHighlight}
          updateHighlightRule={updateHighlightRule}
          updateHash={updateHash}
          rules={ifgRules}
        />
      </div>

      <SidebarFooter />
    </div>
  );
}
