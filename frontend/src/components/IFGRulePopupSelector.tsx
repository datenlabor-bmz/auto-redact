import { IFGRule } from "../types/highlights";

interface IFGRulePopupSelectorProps {
  rules: IFGRule[];
  onRuleSelect: (rule?: IFGRule) => void;
  onSimpleHighlight: () => void;
}

export function IFGRulePopupSelector({
  rules,
  onRuleSelect,
  onSimpleHighlight,
}: IFGRulePopupSelectorProps) {
  // Sort rules by reference for consistent ordering
  const sortedRules = [...rules].sort((a, b) =>
    a.reference.localeCompare(b.reference)
  );

  return (
    <div className="flex flex-row justify-center items-start gap-2">
      <button
        onClick={onSimpleHighlight}
        className="select-none flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
        aria-label="Add highlight"
      >
        +
      </button>
      <div className="grid grid-cols-[1fr,1px,1fr] gap-x-4 bg-white border border-gray-300 rounded-md p-2 shadow-md max-w-2xl">
        <div className="space-y-0.5">
          {sortedRules
            .slice(0, Math.ceil(sortedRules.length / 2))
            .map((rule, index) => {
              const currentParagraph = rule.reference.slice(0, 2);
              const previousParagraph =
                index > 0 ? sortedRules[index - 1].reference.slice(0, 2) : null;
              const isFirstInParagraph = currentParagraph !== previousParagraph;

              return (
                <div
                  key={rule.reference}
                  onClick={() => onRuleSelect(rule)}
                  className="cursor-pointer hover:bg-gray-100 rounded px-2 py-1 text-sm flex items-start"
                >
                  <div className="w-9 shrink-0">
                    {isFirstInParagraph && (
                      <span className="text-gray-500 font-medium">
                        §{currentParagraph}
                      </span>
                    )}
                  </div>
                  <span className="text-gray-900 break-words">
                    {rule.title}
                  </span>
                </div>
              );
            })}
        </div>
        <div className="w-px bg-gray-200 h-full" />
        <div className="space-y-0.5">
          {sortedRules
            .slice(Math.ceil(sortedRules.length / 2))
            .map((rule, index) => {
              const currentParagraph = rule.reference.slice(0, 2);
              const previousParagraph =
                index > 0
                  ? sortedRules
                      .slice(Math.ceil(sortedRules.length / 2))
                      [index - 1].reference.slice(0, 2)
                  : null;
              const isFirstInParagraph = currentParagraph !== previousParagraph;

              return (
                <div
                  key={rule.reference}
                  onClick={() => onRuleSelect(rule)}
                  className="cursor-pointer hover:bg-gray-100 rounded px-2 py-1 text-sm flex items-start"
                >
                  <div className="w-9 shrink-0">
                    {isFirstInParagraph && (
                      <span className="text-gray-500 font-medium">
                        §{currentParagraph}
                      </span>
                    )}
                  </div>
                  <span className="text-gray-900 break-words">
                    {rule.title}
                  </span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
