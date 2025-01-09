import * as React from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { t } from "../translations";
import { Button } from "./ui/Button";

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
  const { language } = useLanguage();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (textareaRef.current) {
      adjustTextareaHeight(textareaRef.current);
    }
  }, [customPrompt]);

  return (
    <div className="mb-4">
      <label
        htmlFor="prompt-input"
        className="block mb-2 text-sm font-semibold text-neutral-text-primary"
      >
        {t(language, "promptInput.label")}
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
        className="
          w-full min-h-[70px] mb-2 p-3
          text-xs font-mono leading-relaxed
          border border-neutral-border rounded-lg
          resize-none overflow-hidden
          bg-white text-neutral-text-primary
          focus:border-primary-main focus:ring-1 focus:ring-primary-main
          transition-colors duration-200
        "
      />
      <Button
        onClick={onAnalyzePdf}
        disabled={isAnalyzing}
        variant="primary"
        className="w-full"
        isLoading={isAnalyzing}
      >
        {isAnalyzing
          ? t(language, "promptInput.button.analyzing")
          : t(language, "promptInput.button.analyze")}
      </Button>
    </div>
  );
}
