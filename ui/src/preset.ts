import type { Config } from "tailwindcss";

/**
 * Shared design tokens for all portals. Consumed by each app's
 * tailwind.config via `presets: [uiPreset]`. A plain-JS twin (preset.js)
 * is used by Tailwind's runtime config loader.
 */
const uiPreset: Partial<Config> = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        primary: "var(--bio-primary)",
        "primary-fg": "var(--bio-primary-fg)",
        surface: "var(--bio-surface)",
        "surface-2": "var(--bio-surface-2)",
        border: "var(--bio-border)",
        muted: "var(--bio-muted)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.06), 0 1px 3px rgba(15,23,42,0.04)",
        pop: "0 10px 30px rgba(15,23,42,0.12)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
      },
    },
  },
  plugins: [],
};

export default uiPreset;
