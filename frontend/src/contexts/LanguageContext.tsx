import * as React from "react";
import type { Language } from "../translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const LanguageContext = React.createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
});

const LANGUAGE_COOKIE_NAME = "preferred_language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Initialize language from cookie or default to 'en'
  const [language, setLanguageState] = React.useState<Language>(() => {
    const storedLang = document.cookie
      .split("; ")
      .find((row) => row.startsWith(LANGUAGE_COOKIE_NAME))
      ?.split("=")[1];
    return storedLang === "en" || storedLang === "de" ? storedLang : "en";
  });

  const setLanguage = React.useCallback((lang: Language) => {
    // Save to cookie with 1 year expiry
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    document.cookie = `${LANGUAGE_COOKIE_NAME}=${lang}; expires=${expiryDate.toUTCString()}; path=/`;
    setLanguageState(lang);
  }, []);

  const value = React.useMemo(
    () => ({
      language,
      setLanguage,
    }),
    [language, setLanguage]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = React.useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
