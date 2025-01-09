import * as React from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { t, translations } from "../translations";

export function RedactionHints() {
  const { language } = useLanguage();
  const hints = translations[language].redactionHints.hints;

  return (
    <div
      style={{
        padding: "1.25rem",
        backgroundColor: "#fff",
        borderRadius: "8px",
        fontSize: "0.85rem",
        color: "#1e293b",
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div style={{ marginBottom: "0.75rem", fontWeight: "600" }}>
        {t(language, "redactionHints.title")}
      </div>
      <ul
        style={{
          margin: "0",
          paddingLeft: "1.2rem",
          lineHeight: "1.4",
        }}
      >
        {hints.map((hint: string, index: number) => (
          <li key={index}>{hint}</li>
        ))}
      </ul>
    </div>
  );
}
