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
        yametee: {
          black: "var(--yametee-black)",
          red: "var(--yametee-red)",
          white: "var(--yametee-white)",
          dark: "var(--yametee-dark)",
          gray: "var(--yametee-gray)",
          lightGray: "var(--yametee-light-gray)",
          bg: "var(--yametee-bg)",
          redDark: "var(--yametee-red-dark)",
        },
        "yametee-border": "var(--yametee-border)",
        "yametee-border-strong": "var(--yametee-border-strong)",
        "yametee-foreground": "var(--yametee-foreground)",
        "yametee-muted": "var(--yametee-muted)",
        "yametee-muted-strong": "var(--yametee-muted-strong)",
      },
    },
  },
  darkMode: 'class',
  plugins: [],
};
export default config;
