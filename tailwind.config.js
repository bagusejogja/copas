/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'muh-green': '#0a6336',
        'muh-green-light': '#168b4e',
        'muh-green-dark': '#064022',
        'muh-gold': '#c39a2f',
      },
    },
  },
  plugins: [],
}
