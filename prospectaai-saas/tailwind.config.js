/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563eb",        // Azul royal
        secondary: "#f3f4f6",      // Ciano (sky-400) — moderno e coeso
        muted: "#6b7280",          // Gray-500
        background: "#ffffff",
        foreground: "#1e3a8a",     // Gray-900
        card: "#f9fafb",           // Gray-50
        border: "#e5e7eb",         // Gray-200
      }
    },
  },
  plugins: [],
}
