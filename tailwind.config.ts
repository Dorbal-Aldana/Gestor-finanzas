import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563eb",
          foreground: "#ffffff"
        },
        background: "#020617",
        foreground: "#e5e7eb"
      }
    }
  },
  plugins: []
};

export default config;

