import * as React from "react";
import { useDropzone, FileRejection, DropEvent } from "react-dropzone";
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
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleDrop = React.useCallback(
    (
      acceptedFiles: File[],
      fileRejections: FileRejection[],
      event: DropEvent
    ) => {
      if (fileRejections.length > 0) {
        // Handle rejected files (non-PDF)
        console.log("Rejected files:", fileRejections);
        return;
      }

      if (acceptedFiles.length > 0) {
        setIsProcessing(true);
        const syntheticTarget = {
          files: acceptedFiles,
          value: "",
        } as unknown as EventTarget & HTMLInputElement;

        const syntheticEvent = {
          target: syntheticTarget,
          currentTarget: syntheticTarget,
          preventDefault: () => {},
          stopPropagation: () => {},
        } as unknown as React.ChangeEvent<HTMLInputElement>;

        onFileUpload(syntheticEvent);
        setTimeout(() => setIsProcessing(false), 1000); // Reset after a delay
      }
    },
    [onFileUpload]
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
    acceptedFiles,
    fileRejections,
  } = useDropzone({
    onDrop: handleDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  // Get the appropriate message based on the current state
  const getMessage = () => {
    if (isProcessing) return t(language, "fileUpload.processingFile");
    if (isDragActive) {
      if (isDragReject) return t(language, "fileUpload.invalidFile");
      if (isDragAccept) return t(language, "fileUpload.dragActive");
      return t(language, "fileUpload.dropHere");
    }
    if (currentFileName) {
      return currentFileName;
    }
    return t(language, "fileUpload.title");
  };

  const getSubMessage = () => {
    if (isProcessing || isDragActive) return null;
    if (currentFileName) {
      return t(language, "fileUpload.changeDocument");
    }
    return t(language, "fileUpload.subtitle");
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        {...getRootProps({
          className: `
            flex items-center gap-4 p-4 
            bg-neutral-white 
            border-2 
            rounded-lg 
            cursor-pointer 
            shadow-upload
            transition-all duration-200 ease-in-out
            outline-none
            h-[72px]
            ${
              isDragActive
                ? isDragReject
                  ? "border-red-500 bg-red-50"
                  : isDragAccept
                    ? "border-action-dragborder bg-action-dragover scale-[1.02] shadow-upload-hover"
                    : "border-action-dragborder bg-action-dragover"
                : "border-neutral-border hover:border-primary-main hover:bg-action-hover hover:shadow-upload-hover hover:scale-[1.01]"
            }
            ${isProcessing ? "opacity-75" : ""}
            active:shadow-upload-active 
            active:scale-100
            focus-visible:ring-2 
            focus-visible:ring-primary-main 
            focus-visible:ring-offset-2
            disabled:opacity-50
            disabled:cursor-not-allowed
          `,
          onClick: (e) => {
            if (isProcessing) {
              e.stopPropagation();
              e.preventDefault();
            }
          },
        })}
        role="button"
        aria-label={
          currentFileName
            ? `${currentFileName} - ${t(language, "fileUpload.changeDocument")}`
            : getMessage()
        }
      >
        <input
          {...getInputProps({
            onClick: (e) => {
              e.stopPropagation();
            },
          })}
          className="hidden"
          aria-hidden="true"
          disabled={isProcessing}
        />
        <span
          className="text-xl flex-shrink-0 w-6 text-center"
          aria-hidden="true"
        >
          {isDragReject ? "⚠️" : "📄"}
        </span>
        <div className="flex-1 min-w-0 flex flex-col justify-center min-h-[44px]">
          <div
            className={`
              text-sm font-medium
              ${isDragReject ? "text-red-600" : "text-neutral-text-primary"}
              ${!isDragActive && !isProcessing ? "group-hover:text-primary-main" : ""}
              transition-colors duration-200
              ${currentFileName ? "truncate" : "whitespace-nowrap"}
              leading-5
            `}
            title={currentFileName || undefined}
          >
            {getMessage()}
          </div>
          {getSubMessage() && (
            <div className="text-xs text-neutral-text-tertiary whitespace-nowrap leading-4 mt-1">
              {getSubMessage()}
            </div>
          )}
        </div>
      </div>

      {currentPdfFile && !isProcessing && (
        <div className="download-dropdown relative">
          <button
            className="
              w-full px-4 py-3 text-sm font-medium 
              text-neutral-text-primary 
              bg-neutral-white 
              border border-neutral-border
              rounded-lg 
              hover:bg-action-hover 
              transition-colors duration-200 
              flex items-center justify-between
            "
            onClick={(e) => {
              e.stopPropagation();
              setShowOptions(!showOptions);
            }}
          >
            <span>{t(language, "fileUpload.saveDocument")}</span>
            <span className="text-xs opacity-60">▾</span>
          </button>

          {showOptions && (
            <div
              className="
                absolute top-full left-0 right-0 mt-1 
                bg-neutral-white 
                border border-neutral-border 
                rounded-lg shadow-lg 
                overflow-hidden z-10
              "
            >
              <button
                className="
                  w-full px-4 py-3 text-sm text-left 
                  hover:bg-action-hover 
                  transition-colors duration-200 
                  flex items-center gap-3
                "
                onClick={() => {
                  downloadPdf(currentPdfFile, highlights, true);
                  setShowOptions(false);
                }}
              >
                <span>🟨</span>
                {t(language, "fileUpload.downloadDraft")}
              </button>
              <button
                className="
                  w-full px-4 py-3 text-sm text-left 
                  hover:bg-action-hover 
                  transition-colors duration-200 
                  flex items-center gap-3 
                  border-t border-neutral-border
                "
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
