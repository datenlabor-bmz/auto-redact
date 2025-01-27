import * as React from "react";
import { SidebarHighlight } from "./SidebarHighlight";
import { useLanguage } from "../contexts/LanguageContext";
import { t } from "../translations";
import type { IFGRule, SecuredactHighlight } from "../types/highlights";
import { Button } from "./ui/Button";

interface Props {
  highlights: Array<SecuredactHighlight>;
  resetHighlights: () => void;
  onDeleteHighlight?: (id: string) => void;
  updateHighlightRule: (
    highlight: SecuredactHighlight,
    rule: IFGRule | undefined
  ) => void;
  updateHash: (highlight: SecuredactHighlight) => void;
  rules: IFGRule[];
}

export function SidebarHighlightsList({
  highlights,
  resetHighlights,
  onDeleteHighlight,
  updateHighlightRule,
  updateHash,
  rules,
}: Props) {
  const { language } = useLanguage();
  const sortedHighlights = [...highlights].sort((a, b) => {
    if (a.position.pageNumber !== b.position.pageNumber) {
      return a.position.pageNumber - b.position.pageNumber;
    }
    return a.position.boundingRect.y1 - b.position.boundingRect.y1;
  });

  if (highlights.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex justify-between items-center mb-2">
        <div className="font-semibold text-neutral-text-primary">
          {t(language, "redactions.title")}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetHighlights}
          className="text-neutral-text-tertiary hover:text-neutral-text-secondary"
        >
          {t(language, "redactions.resetAll")}
        </Button>
      </div>

      <ul className="flex flex-col gap-2 m-0 p-0">
        {sortedHighlights.map((highlight, index) => {
          const showPageNumber =
            index === 0 ||
            highlight.position.pageNumber !==
              sortedHighlights[index - 1].position.pageNumber;

          return (
            <React.Fragment key={highlight.id}>
              {showPageNumber && (
                <div
                  className={`
                  text-xs text-neutral-text-tertiary py-0.5
                  ${index === 0 ? "mt-0" : "mt-1"}
                `}
                >
                  Page {highlight.position.pageNumber}
                </div>
              )}
              <SidebarHighlight
                highlight={highlight}
                onDeleteHighlight={onDeleteHighlight}
                updateHighlightRule={updateHighlightRule}
                updateHash={updateHash}
                rules={rules}
              />
            </React.Fragment>
          );
        })}
      </ul>
    </>
  );
}
