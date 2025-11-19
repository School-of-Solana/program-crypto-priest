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
        // Main palette
        "ash-grey": "#cad2c5",
        "muted-teal": "#84a98c",
        "deep-teal": "#52796f",
        "dark-slate": "#354f52",
        "charcoal": "#2f3e46",

        // Background colors
        "primary-bg": "#f5f7f4",
        "secondary-bg": "#ffffff",
        "card-bg": "#ffffff",

        // Text colors
        text: {
          primary: "#2f3e46",
          secondary: "#354f52",
          muted: "#84a98c",
        },

        // Border colors
        border: {
          light: "#e8ebe7",
          medium: "#cad2c5",
        },

        // Status colors
        status: {
          active: "#84a98c",
          completed: "#52796f",
        },
      },
    },
  },
  plugins: [],
};
export default config;
