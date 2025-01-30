/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          main: "#2563eb",
          light: "#e0f2fe",
          dark: "#1d4ed8",
          text: "#3b82f6",
        },
        neutral: {
          white: "#ffffff",
          background: "#f8fafc",
          border: "#e2e8f0",
          text: {
            primary: "#0f172a",
            secondary: "#475569",
            tertiary: "#94a3b8",
          },
        },
        action: {
          hover: "#f1f5f9",
          active: "#e2e8f0",
          dragover: "#bfdbfe",
          dragborder: "#3b82f6",
        },
      },
      boxShadow: {
        'upload': '0 2px 4px rgba(0, 0, 0, 0.05)',
        'upload-hover': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'upload-active': '0 1px 2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  darkMode: 'class',
  plugins: [],
}

