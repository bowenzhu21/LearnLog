import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx,mdx}",
    "./src/components/**/*.{ts,tsx,mdx}",
    "./src/lib/**/*.{ts,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#f7f8fb",
        surface: "#ffffff",
        primary: {
          50: "#f2f6ff",
          100: "#dbe6ff",
          200: "#bfd3ff",
          300: "#9ebdff",
          400: "#7ca6ff",
          500: "#5a8dff",
          600: "#3c6ce6",
          700: "#2b51b3",
          800: "#1d3880",
          900: "#11204d",
        },
        accent: "#24a0a8",
        muted: "#64748b",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "Menlo", "monospace"],
      },
      boxShadow: {
        soft: "0 20px 40px -24px rgba(15, 46, 90, 0.25)",
      },
      borderRadius: {
        xl: "1.25rem",
      },
      container: {
        center: true,
        padding: {
          DEFAULT: "1.5rem",
          lg: "2rem",
          xl: "2.5rem",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;
