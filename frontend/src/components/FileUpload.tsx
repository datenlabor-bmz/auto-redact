import * as React from "react";
import { downloadPdf } from "../actions/download";
import { useLanguage } from "../contexts/LanguageContext";
import { t } from "../translations";
import type { SecuredactHighlight } from "../types/highlights";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";

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
    <div className="flex flex-col gap-4">
      <label className="flex items-center gap-4 p-4 bg-white border border-neutral-border rounded-lg cursor-pointer hover:bg-action-hover transition-colors duration-200">
        <input
          type="file"
          accept=".pdf"
          onChange={onFileUpload}
          className="hidden"
        />
        <span className="text-xl flex-shrink-0">📄</span>
        <div className="flex-1 min-w-0">
          {currentFileName ? (
            <>
              <div
                className="text-sm font-medium text-neutral-text-primary truncate"
                title={currentFileName}
              >
                {currentFileName}
              </div>
              <div className="text-xs text-neutral-text-tertiary whitespace-nowrap">
                {t(language, "fileUpload.changeDocument")}
              </div>
            </>
          ) : (
            <>
              <div className="text-sm font-medium text-neutral-text-primary whitespace-nowrap">
                {t(language, "fileUpload.title")}
              </div>
              <div className="text-xs text-neutral-text-tertiary whitespace-nowrap">
                {t(language, "fileUpload.subtitle")}
              </div>
            </>
          )}
        </div>
      </label>

      {currentPdfFile && (
        <div className="download-dropdown relative">
          <button
            className="w-full px-4 py-3 text-sm font-medium text-neutral-text-primary bg-white border border-neutral-border rounded-lg hover:bg-action-hover transition-colors duration-200 flex items-center justify-between"
            onClick={(e) => {
              e.stopPropagation();
              setShowOptions(!showOptions);
            }}
          >
            <span>{t(language, "fileUpload.saveDocument")}</span>
            <span className="text-xs opacity-60">▾</span>
          </button>
          
          {showOptions && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-border rounded-lg shadow-lg overflow-hidden z-10">
              <button
                className="w-full px-4 py-3 text-sm text-left hover:bg-action-hover transition-colors duration-200 flex items-center gap-3"
                onClick={() => {
                  downloadPdf(currentPdfFile, highlights, true);
                  setShowOptions(false);
                }}
              >
                <span>🟨</span>
                {t(language, "fileUpload.downloadDraft")}
              </button>
              <button
                className="w-full px-4 py-3 text-sm text-left hover:bg-action-hover transition-colors duration-200 flex items-center gap-3 border-t border-neutral-border"
                onClick={() => {
                  downloadPdf(currentPdfFile, highlights, false);
                  setShowOptions(false);
                }}
              >
                <span>⬛️</span>
                {t(language, "fileUpload.downloadRedacted")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
