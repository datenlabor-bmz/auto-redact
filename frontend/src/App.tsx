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
import type { IFGRule, SecuredactHighlight } from "./types/highlights";
import { useLanguage } from "./contexts/LanguageContext";
import { t } from "./translations";

import "./style/App.css";
import "../node_modules/react-pdf-highlighter/dist/style.css";

// Load IFG rules from the JSON file
import ifgRulesData from "../../rules/informationsfreiheitsgesetz.json";
const ifgRules: IFGRule[] = ifgRulesData.rules;

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

  const addHighlight = (highlight: NewHighlight | SecuredactHighlight) => {
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
                    hideTipAndSelection,
                    _transformSelection
                  ) => {
                    // Sort rules by reference for consistent ordering
                    const sortedRules = [...ifgRules].sort((a, b) => 
                      a.reference.localeCompare(b.reference)
                    );

                    return (
                      <div className="flex flex-row justify-center items-start gap-2">
                        <button
                          onClick={() => {
                            addHighlight({
                              content,
                              position,
                              comment: { text: "", emoji: "" },
                            });
                            hideTipAndSelection();
                          }}
                          className="select-none flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                          aria-label="Add highlight"
                        >
                          +
                        </button>
                        <div className="grid grid-cols-[1fr,1px,1fr] gap-x-4 bg-white border border-gray-300 rounded-md p-2 shadow-md max-w-2xl">
                          <div className="space-y-0.5">
                            {sortedRules.slice(0, Math.ceil(sortedRules.length / 2)).map((rule, index) => {
                              const currentParagraph = rule.reference.slice(0, 2);
                              const previousParagraph = index > 0 ? 
                                sortedRules[index - 1].reference.slice(0, 2) : null;
                              const isFirstInParagraph = currentParagraph !== previousParagraph;

                              return (
                                <div
                                  key={rule.reference}
                                  onClick={() => {
                                    addHighlight({
                                      content,
                                      position,
                                      comment: { text: "", emoji: "" },
                                      ifgRule: rule,
                                    });
                                    hideTipAndSelection();
                                  }}
                                  className="cursor-pointer hover:bg-gray-100 rounded px-2 py-1 text-sm flex items-start"
                                >
                                  <div className="w-9 shrink-0">
                                    {isFirstInParagraph && (
                                      <span className="text-gray-500 font-medium">§{currentParagraph}</span>
                                    )}
                                  </div>
                                  <span className="text-gray-900 break-words">{rule.title}</span>
                                </div>
                              );
                            })}
                          </div>
                          <div className="w-px bg-gray-200 h-full" />
                          <div className="space-y-0.5">
                            {sortedRules.slice(Math.ceil(sortedRules.length / 2)).map((rule, index) => {
                              const currentParagraph = rule.reference.slice(0, 2);
                              const previousParagraph = index > 0 ? 
                                sortedRules.slice(Math.ceil(sortedRules.length / 2))[index - 1].reference.slice(0, 2) : null;
                              const isFirstInParagraph = currentParagraph !== previousParagraph;

                              return (
                                <div
                                  key={rule.reference}
                                  onClick={() => {
                                    addHighlight({
                                      content,
                                      position,
                                      comment: { text: "", emoji: "" },
                                      ifgRule: rule,
                                    });
                                    hideTipAndSelection();
                                  }}
                                  className="cursor-pointer hover:bg-gray-100 rounded px-2 py-1 text-sm flex items-start"
                                >
                                  <div className="w-9 shrink-0">
                                    {isFirstInParagraph && (
                                      <span className="text-gray-500 font-medium">§{currentParagraph}</span>
                                    )}
                                  </div>
                                  <span className="text-gray-900 break-words">{rule.title}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
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
                    const { left, top, width, height } =
                      highlight.position.rects[0];
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
                            left: left + width - 10,
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
