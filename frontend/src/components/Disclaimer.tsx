import * as React from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { t } from "../translations";
import { Button } from "./ui/Button";

interface DisclaimerProps {
  onClose: () => void;
}

export const Disclaimer: React.FC<DisclaimerProps> = ({ onClose }) => {
  const { language } = useLanguage();

  return (
    <div
      className="
      bg-yellow-50 text-yellow-800 
      px-4 py-3 text-center text-sm
      border-b border-yellow-100
      relative
    "
    >
      <span role="img" aria-label="warning" className="mr-2">
        ⚠️
      </span>
      <strong>{t(language, "disclaimer.title")}</strong>:{" "}
      {t(language, "disclaimer.message")}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="
          absolute right-2 top-1/2 -translate-y-1/2
          text-yellow-800 hover:bg-yellow-100/50
          !p-1.5
        "
        aria-label={t(language, "disclaimer.close")}
      >
        ×
      </Button>
    </div>
  );
};
