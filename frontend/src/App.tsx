import { useCallback, useEffect, useRef, useState } from "react";
import * as React from "react";

import {
  AreaHighlight,
  Highlight,
  PdfHighlighter,
  PdfLoader,
} from "react-pdf-highlighter";
import type {
  Content,
  NewHighlight,
  ScaledPosition,
} from "react-pdf-highlighter";

import { Sidebar } from "./Sidebar";
import { Disclaimer } from "./components/Disclaimer";
import { Spinner } from "./components/Spinner";
import { LanguageProvider } from "./contexts/LanguageContext";
import type { SecuredactHighlight } from "./types/highlights";
import { useLanguage } from "./contexts/LanguageContext";
import { t } from "./translations";

import "./style/App.css";
import "../node_modules/react-pdf-highlighter/dist/style.css";

const getNextId = () => String(Math.random()).slice(2);

const parseIdFromHash = () =>
  document.location.hash.slice("#highlight-".length);

const resetHash = () => {
  document.location.hash = "";
};

function AppContent() {
  const [url, setUrl] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<Array<SecuredactHighlight>>([]);
  const [currentPdfFile, setCurrentPdfFile] = useState<File | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>(
    "Redact all personal information, confidential data, and sensitive business information."
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const { language } = useLanguage();
  const resetHighlights = () => {
    setHighlights([]);
  };

  const scrollViewerTo = useRef<(highlight: SecuredactHighlight) => void>(
    () => {}
  );

  const scrollToHighlightFromHash = useCallback(() => {
    const highlightId = parseIdFromHash();
    if (!highlightId) return;

    const highlight = highlights.find((h) => h.id === highlightId);
    if (highlight) {
      // Add a small delay to ensure the PDF is ready
      setTimeout(() => {
        scrollViewerTo.current(highlight);
      }, 100);
    }
  }, [highlights]);

  useEffect(() => {
    window.addEventListener("hashchange", scrollToHighlightFromHash, false);
    return () => {
      window.removeEventListener(
        "hashchange",
        scrollToHighlightFromHash,
        false
      );
    };
  }, [scrollToHighlightFromHash]);

  const _getHighlightById = (id: string) => {
    return highlights.find((highlight) => highlight.id === id);
  };

  const addHighlight = (highlight: NewHighlight) => {
    const enrichedHighlight: SecuredactHighlight = {
      ...highlight,
      id: getNextId(),
    };
    setHighlights((prevHighlights) => [enrichedHighlight, ...prevHighlights]);
  };

  const updateHighlight = (
    highlightId: string,
    position: Partial<ScaledPosition>,
    content: Partial<Content>
  ) => {
    setHighlights((prevHighlights) =>
      prevHighlights.map((h) => {
        const {
          id,
          position: originalPosition,
          content: originalContent,
          ...rest
        } = h;
        return id === highlightId
          ? {
              id,
              position: { ...originalPosition, ...position },
              content: { ...originalContent, ...content },
              ...rest,
            }
          : h;
      })
    );
  };

  const handleFileUpload = (
    fileUrl: string,
    file: File,
    highlights: Array<SecuredactHighlight>
  ) => {
    setUrl(fileUrl);
    setCurrentPdfFile(file);
    setHighlights(highlights);
  };

  const deleteHighlight = useCallback((id: string) => {
    window.getSelection()?.removeAllRanges();
    setHighlights((prevHighlights) =>
      prevHighlights.filter((hl) => hl.id !== id)
    );
  }, []);

  return (
    <div className="flex flex-col h-full">
      {showDisclaimer && (
        <Disclaimer onClose={() => setShowDisclaimer(false)} />
      )}
      <div
        className={`
        flex flex-1 overflow-hidden
        ${showDisclaimer ? "h-[calc(100%-40px)]" : "h-full"}
      `}
      >
        <Sidebar
          highlights={highlights}
          resetHighlights={resetHighlights}
          onFileUpload={handleFileUpload}
          onDeleteHighlight={deleteHighlight}
          currentPdfFile={currentPdfFile}
          customPrompt={customPrompt}
          setCustomPrompt={setCustomPrompt}
          isAnalyzing={isAnalyzing}
          setIsAnalyzing={setIsAnalyzing}
          setHighlights={setHighlights}
          addHighlight={addHighlight}
        />
        <div className="pdf-viewer">
          {url ? (
            <PdfLoader url={url} beforeLoad={<Spinner />}>
              {(pdfDocument) => (
                <PdfHighlighter
                  pdfDocument={pdfDocument}
                  pdfScaleValue="page-width"
                  enableAreaSelection={(event) => event.altKey}
                  onScrollChange={resetHash}
                  scrollRef={(scrollTo) => {
                    scrollViewerTo.current = scrollTo;
                    if (document.location.hash) {
                      scrollToHighlightFromHash();
                    }
                  }}
                  onSelectionFinished={(
                    position,
                    content,
                    _hideTipAndSelection,
                    _transformSelection
                  ) => {
                    addHighlight({
                      content,
                      position,
                      comment: { text: "", emoji: "" },
                    });
                    return null;
                  }}
                  highlightTransform={(
                    highlight,
                    _index,
                    _setTip,
                    _hideTip,
                    viewportToScaled,
                    screenshot,
                    isScrolledTo
                  ) => {
                    const isTextHighlight = !highlight.content?.image;
                    const { left, top, width, height } = highlight.position.rects[0];
                    return isTextHighlight ? (
                      <div>
                        <Highlight
                          isScrolledTo={isScrolledTo}
                          position={highlight.position}
                          comment={highlight.comment}
                        />
                        <button
                          onClick={() => deleteHighlight(highlight.id)}
                          style={{
                            position: "absolute",
                            top: top - 10,
                            left: left + width - 10
                          }}
                          className="select-none flex items-center justify-center w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs font-bold shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                          aria-label="Delete highlight"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div onClick={() => deleteHighlight(highlight.id)}>
                        <AreaHighlight
                          isScrolledTo={isScrolledTo}
                          highlight={highlight}
                          onChange={(boundingRect) => {
                            updateHighlight(
                              highlight.id,
                              { boundingRect: viewportToScaled(boundingRect) },
                              { image: screenshot(boundingRect) }
                            );
                          }}
                        />
                      </div>
                    );
                  }}
                  highlights={highlights}
                />
              )}
            </PdfLoader>
          ) : (
            <div className="flex items-center justify-center h-full text-neutral-text-tertiary">
              {t(language, "fileUpload.noDocumentSelected")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
