import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy:     "#0B1D3A",
          blue:     "#2563EB",
          teal:     "#10B5A6",
          green:    "#10B981",
          gold:     "#D4A373",
          offwhite: "#F8F5F0",
          midnight: "#112A4F",
          plum:     "#7C3AED",
        },
      },
      fontFamily: {
        heading: ["var(--font-sora)", "system-ui", "sans-serif"],
        sans:    ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
        btn:  "10px",
      },
      boxShadow: {
        card:       "0 1px 4px rgba(11,29,58,0.08), 0 4px 12px rgba(11,29,58,0.04)",
        "card-hover": "0 4px 16px rgba(11,29,58,0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
