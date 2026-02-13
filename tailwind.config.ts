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
        background: "#121212",
        surface: "#1E1E1E",
        primary: {
          DEFAULT: "#00693E",
          hover: "#005030",
        },
        text: {
          DEFAULT: "#E0E0E0",
          secondary: "#A0A0A0",
        },
        border: "#2E2E2E",
        error: "#CF6679",
      },
    },
  },
  plugins: [],
};
export default config;