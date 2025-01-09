import * as React from "react";
import type { Language } from "../translations";

interface LanguageSelectorProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

export function LanguageSelector({
  currentLanguage,
  onLanguageChange,
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleLanguageChange = (lang: Language) => {
    onLanguageChange(lang);
    setIsOpen(false);
  };

  return (
    <div style={{ position: "relative" }}>
      <select
        value={currentLanguage}
        onChange={(e) => handleLanguageChange(e.target.value as Language)}
        style={{
          appearance: "none",
          WebkitAppearance: "none",
          padding: "0.4rem 1.5rem 0.4rem 0.6rem",
          fontSize: "0.875rem",
          color: "#1e293b",
          backgroundColor: "transparent",
          border: "none",
          cursor: "pointer",
          outline: "none",
        }}
      >
        <option value="en">🇬🇧 English</option>
        <option value="de">🇩🇪 Deutsch</option>
      </select>
      <span
        style={{
          position: "absolute",
          right: "0.4rem",
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          fontSize: "0.75rem",
        }}
      >
        ▼
      </span>
    </div>
  );
}
