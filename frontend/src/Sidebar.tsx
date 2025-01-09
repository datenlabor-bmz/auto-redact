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
    <div className="w-[20%] min-w-[300px] h-full overflow-auto bg-neutral-background border-r border-neutral-border">
      <div className="p-8 border-b border-neutral-border">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">⬛️</span>
          <h1 className="text-2xl font-bold text-neutral-text-primary">
            {t(language, "app.title")}
          </h1>
        </div>
        <p className="text-sm text-primary-text">
          {t(language, "app.subtitle")}
        </p>
      </div>

      <div className="p-8 space-y-6">
        <FileUpload
          onFileUpload={async (event: React.ChangeEvent<HTMLInputElement>) =>
            await uploadPdf(event, onFileUpload, resetHighlights)
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

        <div className="pt-6 border-t border-neutral-border">
          <SidebarFooter />
        </div>
      </div>
    </div>
  );
}
