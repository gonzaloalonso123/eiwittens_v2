/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        "eiwit-orange": "#FF630D",
        "eiwit-blue": "#00BED1",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
