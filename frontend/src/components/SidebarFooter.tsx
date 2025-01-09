import { useState } from "react";
import * as React from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { t } from "../translations";
import { LanguageSelector } from "./LanguageSelector";

export function SidebarFooter() {
  const [showTooltip, setShowTooltip] = useState(false);
  const { language, setLanguage } = useLanguage();

  return (
    <div className="text-sm text-primary-text">
      <div className="flex items-center justify-between gap-3">
        <LanguageSelector
          currentLanguage={language}
          onLanguageChange={setLanguage}
        />
        <div className="flex items-center gap-2">
          <div
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className={`
              flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-help relative
              ${showTooltip ? 'bg-gray-100' : 'bg-transparent'}
              transition-all duration-200
            `}
          >
            <span className="text-xl">🇩🇪</span>
            <span className="text-xl">🇪🇺</span>
            <span className="text-xl">🇺🇳</span>
            {showTooltip && (
              <div className="
                absolute bottom-full left-1/2 -translate-x-1/2 mb-3
                bg-white text-gray-700 p-4 rounded-xl text-xs leading-normal
                w-[180px] shadow-lg border border-gray-200 z-10 animate-tooltipFade
              ">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-lg">🇩🇪</span>
                  {t(language, "footer.madeIn")}
                </div>
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-lg">🇪🇺</span>
                  {t(language, "footer.privacy")}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🇺🇳</span>
                  {t(language, "footer.publicGood")}
                </div>
              </div>
            )}
          </div>
          <a
            href="https://github.com/davidpomerenke/securedact"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-2.5 py-1.5 rounded-lg transition-all duration-200 text-gray-600 hover:bg-gray-100"
          >
            <svg
              height="20"
              width="20"
              viewBox="0 0 16 16"
              style={{ fill: "currentColor" }}
            >
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
