import * as React from "react";
import { IFGRuleSelector } from "./IFGRuleSelector";
import type { IFGRule, SecuredactHighlight } from "../types/highlights";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";

interface Props {
  highlight: SecuredactHighlight;
  onDeleteHighlight?: (id: string) => void;
  updateHighlightRule: (
    highlight: SecuredactHighlight,
    rule: IFGRule | undefined
  ) => void;
  updateHash: (highlight: SecuredactHighlight) => void;
  rules: IFGRule[];
}

export function SidebarHighlight({
  highlight,
  onDeleteHighlight,
  updateHighlightRule,
  updateHash,
  rules,
}: Props) {
  return (
    <li className="relative">
      <Card
        className="p-3 bg-blue-50 border-blue-200 cursor-pointer"
        onClick={() => updateHash(highlight)}
      >
        <div className="flex flex-col gap-2">
          <div className="flex flex-col">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteHighlight?.(highlight.id);
              }}
              className="
                absolute top-2 right-2 p-1.5
                text-neutral-text-tertiary hover:text-neutral-text-secondary
                hover:bg-blue-100/50 z-10
              "
              title="Remove redaction"
            >
              ×
            </Button>

            {highlight.content.text && (
              <blockquote className="flex-1 m-0 text-sm leading-relaxed text-slate-700">
                {highlight.content.text.length > 60
                  ? `${highlight.content.text.slice(0, 60).trim()}…`
                  : highlight.content.text.trim()}
              </blockquote>
            )}

            {highlight.content.image && (
              <div className="mt-8 overflow-auto">
                <img
                  src={highlight.content.image}
                  alt="Screenshot"
                  className="max-w-[calc(100%-2px)] h-auto block border border-dashed"
                />
              </div>
            )}
          </div>
        </div>

        <IFGRuleSelector
          rules={rules}
          selectedRule={highlight.ifgRule}
          onSelectRule={(rule) => updateHighlightRule(highlight, rule)}
        />
      </Card>
    </li>
  );
}
