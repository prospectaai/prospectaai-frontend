/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563eb",
        secondary: "#9333ea",
        muted: "#6b7280",
        background: "#ffffff",
        foreground: "#111827",
        card: "#f9fafb",
        border: "#e5e7eb"
      }
    },
  },
  plugins: [],
}
