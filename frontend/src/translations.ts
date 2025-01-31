export const translations = {
  en: {
    app: {
      title: "AutoRedact",
      subtitle: "AI-assisted document redaction",
    },
    disclaimer: {
      title: "DISCLAIMER",
      message:
        "This software is currently in development and not yet ready for production use.",
      close: "Close disclaimer",
    },
    fileUpload: {
      title: "Upload PDF Document",
      subtitle: "or drop file here",
      dropHere: "Drop PDF here",
      changeDocument: "Click to change document",
      saveDocument: "Save document...",
      downloadDraft: "Download draft",
      downloadRedacted: "Download redacted document",
      dragActive: "Release to upload PDF",
      invalidFile: "Please upload a PDF file",
      processingFile: "Processing your file...",
      noDocumentSelected: "No PDF document selected",
    },
    redactionHints: {
      title: "💡 Quick Tips:",
      hints: [
        "Select any text to redact it manually",
        "Hold Alt for larger redaction areas",
      ],
    },
    redactions: {
      title: "Your Redactions",
      resetAll: "🗑️ Clear All",
      page: "Page",
    },
    promptInput: {
      label: "Instructions for the AI:",
      defaultPrompt:
        "Redact all personal information, confidential data, and sensitive business information.",
      button: {
        analyze: "Get AI Redactions",
        analyzing: "Analyzing PDF...",
      },
    },
    footer: {
      madeIn: "Made in Germany",
      privacy: "With European privacy",
      publicGood: "As a Digital Public Good",
    },
    ifgSelector: {
      placeholder: "Select IFG reason...",
      viewLaw: "View law →",
    },
  },
  de: {
    app: {
      title: "AutoRedact",
      subtitle: "Dokumente schwärzen mit KI",
    },
    disclaimer: {
      title: "HINWEIS",
      message:
        "Diese Software ist noch in Entwicklung und nicht für den Produktiveinsatz geeignet.",
      close: "Hinweis schließen",
    },
    fileUpload: {
      title: "PDF-Dokument hochladen",
      subtitle: "oder Datei hier ablegen",
      dropHere: "PDF hier ablegen",
      changeDocument: "Anderes PDF hochladen",
      saveDocument: "Dokument speichern...",
      downloadDraft: "Entwurf herunterladen",
      downloadRedacted: "Geschwärztes Dokument herunterladen",
      dragActive: "Zum Hochladen loslassen",
      invalidFile: "Bitte laden Sie eine PDF-Datei hoch",
      processingFile: "Datei wird verarbeitet...",
      noDocumentSelected: "Kein PDF-Dokument ausgewählt",
    },
    redactionHints: {
      title: "💡 Tipps:",
      hints: [
        "Text markieren für manuelle Schwärzung",
        "Alt-Taste halten, um größere Bereiche zu markieren",
      ],
    },
    redactions: {
      title: "Schwärzungen",
      resetAll: "🗑️ Alle löschen",
      page: "Seite",
    },
    promptInput: {
      label: "Anweisungen für die KI:",
      defaultPrompt:
        "Schwärzen Sie alle persönlichen Informationen, vertraulichen Daten und sensiblen Geschäftsinformationen.",
      button: {
        analyze: "Schwärzen mit KI",
        analyzing: "PDF wird analysiert...",
      },
    },
    footer: {
      madeIn: "Made in Germany",
      privacy: "Mit europäischem Datenschutz",
      publicGood: "Als digitales Gemeingut",
    },
    ifgSelector: {
      placeholder: "IFG-Grund auswählen...",
      viewLaw: "Gesetz ansehen →",
    },
  },
} as const;

export type Language = keyof typeof translations;
export type TranslationKeys = keyof typeof translations.en;

export function t(lang: Language, key: string): string {
  const keys = key.split(".");
  let value: any = translations[lang];

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = value[k];
    } else {
      return key;
    }
  }

  return typeof value === "string" ? value : key;
}
