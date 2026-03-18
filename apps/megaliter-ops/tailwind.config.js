/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        water: {
          50: "#eff8ff",
          100: "#dbeffe",
          200: "#bfe3fe",
          300: "#93d1fd",
          400: "#60b5fa",
          500: "#3b95f6",
          600: "#2577eb",
          700: "#1d62d8",
          800: "#1e50af",
          900: "#1e458a",
        },
      },
    },
  },
  plugins: [],
};
