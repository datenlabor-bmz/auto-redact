import * as React from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { t } from "../translations";

interface DisclaimerProps {
  onClose: () => void;
}

export const Disclaimer: React.FC<DisclaimerProps> = ({ onClose }) => {
  const { language } = useLanguage();
  
  return (
    <div
      style={{
        backgroundColor: "#fff3cd",
        color: "#856404",
        padding: "12px",
        textAlign: "center",
        borderBottom: "1px solid #ffeeba",
        fontSize: "14px",
        position: "relative",
      }}
    >
      <span role="img" aria-label="warning">
        ⚠️
      </span>
      <strong>{t(language, "disclaimer.title")}</strong>: {t(language, "disclaimer.message")}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          right: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "16px",
          color: "#856404",
          padding: "5px",
        }}
        aria-label={t(language, "disclaimer.close")}
      >
        ×
      </button>
    </div>
  );
}; 