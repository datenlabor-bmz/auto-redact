import * as React from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { t, translations } from "../translations";
import { Card } from "./ui/Card";

export function RedactionHints() {
  const { language } = useLanguage();
  const hints = translations[language].redactionHints.hints;

  return (
    <Card className="shadow-sm">
      <div className="mb-3 font-semibold text-neutral-text-primary">
        {t(language, "redactionHints.title")}
      </div>
      <ul className="m-0 pl-5 text-sm leading-relaxed text-neutral-text-primary list-disc">
        {hints.map((hint: string, index: number) => (
          <li key={index}>{hint}</li>
        ))}
      </ul>
    </Card>
  );
}
