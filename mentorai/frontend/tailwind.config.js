/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        void: "#05060f",
        nebula: "#0b0e1e",
        panel: "#0f1329",
        cyan: {
          glow: "#3ee9ff",
        },
        violet: {
          glow: "#9b5cff",
        },
        magenta: {
          glow: "#ff3ea5",
        },
        ink: {
          100: "#e7e9f5",
          400: "#8b90b3",
          600: "#565c85",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        "glow-cyan": "0 0 20px rgba(62, 233, 255, 0.35), 0 0 60px rgba(62, 233, 255, 0.08)",
        "glow-violet": "0 0 20px rgba(155, 92, 255, 0.35), 0 0 60px rgba(155, 92, 255, 0.08)",
        "glow-magenta": "0 0 20px rgba(255, 62, 165, 0.35), 0 0 60px rgba(255, 62, 165, 0.08)",
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to bottom, rgba(5,6,15,0) 0%, rgba(5,6,15,0.9) 100%)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
    },
  },
  plugins: [],
};
