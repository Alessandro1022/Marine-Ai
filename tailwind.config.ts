import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Aetos Systems — graphite + gold, blueprint edition
        ink: {
          950: "#07090E",
          900: "#0C0F16",
          850: "#10141E",
          800: "#151A27",
          700: "#1F2638",
          600: "#2C354D",
          400: "#5B6783",
        },
        surface: {
          DEFAULT: "#0E1220",
          raised: "#131829",
          overlay: "#1A2032",
        },
        gold: {
          200: "#F3DFA8",
          300: "#EAC97E",
          400: "#DDB35C",
          500: "#C99A3C",
          600: "#A87E2C",
          700: "#7D5D1F",
        },
        signal: {
          green: "#3DD68C",
          red: "#F2555A",
          amber: "#F5A623",
          blue: "#5B8DEF",
        },
        blueprint: "#1B2740",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,.3), 0 12px 32px -16px rgba(0,0,0,.5)",
        glow: "0 0 0 1px rgba(221,179,92,.28), 0 0 32px -8px rgba(221,179,92,.4)",
        glowRed: "0 0 0 1px rgba(242,85,90,.25), 0 0 32px -8px rgba(242,85,90,.35)",
        inset: "inset 0 1px 0 rgba(255,255,255,.04)",
      },
      borderRadius: {
        xl2: "1rem",
      },
      keyframes: {
        pulseRing: {
          "0%": { boxShadow: "0 0 0 0 rgba(61,214,140,.35)" },
          "70%": { boxShadow: "0 0 0 22px rgba(61,214,140,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(61,214,140,0)" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        countGlow: {
          "0%, 100%": { textShadow: "0 0 0 rgba(221,179,92,0)" },
          "50%": { textShadow: "0 0 24px rgba(221,179,92,.45)" },
        },
      },
      animation: {
        pulseRing: "pulseRing 2.2s ease-out infinite",
        rise: "rise .4s cubic-bezier(.21,.9,.35,1) both",
        shimmer: "shimmer 1.4s linear infinite",
        countGlow: "countGlow 3s ease-in-out infinite",
      },
      transitionTimingFunction: {
        snappy: "cubic-bezier(.21,.9,.35,1)",
      },
    },
  },
  plugins: [],
};
export default config;
