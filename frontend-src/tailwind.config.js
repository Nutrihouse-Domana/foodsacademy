/** @type {import('tailwindcss').Config} */
module.exports = {
  // As variantes dark seguem a classe aplicada pelo contexto de tema.
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {},
  },
  plugins: [],
};