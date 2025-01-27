import * as React from "react";
import type { Language } from "../translations";
import { Select } from "./ui/Select";

interface LanguageSelectorProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

const languageOptions = [
  { value: "en", label: "🇬🇧 English" },
  { value: "de", label: "🇩🇪 Deutsch" },
];

export function LanguageSelector({
  currentLanguage,
  onLanguageChange,
}: LanguageSelectorProps) {
  return (
    <Select
      value={currentLanguage}
      onChange={(e) => onLanguageChange(e.target.value as Language)}
      options={languageOptions}
      size="sm"
      minimal
      className="text-neutral-text-primary min-w-[110px]"
    />
  );
}
