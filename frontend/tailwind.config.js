/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        display: ["'Plus Jakarta Sans'", "ui-sans-serif", "sans-serif"],
        body: ["'Inter'", "ui-sans-serif", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#6366f1",
          50: "#eef0ff",
          100: "#e0e2ff",
          200: "#c6c9ff",
          300: "#a5a4ff",
          400: "#8a80ff",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#372fa3",
          900: "#312b81",
        },
        surface: {
          light: "#ffffff",
          dark: "#0f1420",
        },
      },
      borderRadius: {
        DEFAULT: "0.75rem",
      },
    },
  },
  plugins: [],
};
