import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          bg: "#000000",
          secondary: "#ffffff",
        },
        accent: {
          purple: "#7c3aed",
          cyan: "#0891b2",
          pink: "#db2777",
          orange: "#ea580c",
        },
        text: {
          primary: "#0f172a",
          secondary: "#475569",
          muted: "#94a3b8",
        },
        border: {
          light: "#e2e8f0",
          medium: "#cbd5e1",
        },
        status: {
          active: "#059669",
          pending: "#d97706",
          completed: "#6366f1",
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #0891b2 0%, #7c3aed 100%)',
        'gradient-accent': 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
      },
    },
  },
  plugins: [],
};
export default config;
