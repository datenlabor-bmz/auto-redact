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
        },
      },
    },
  },
  darkMode: 'class',
  plugins: [],
}

