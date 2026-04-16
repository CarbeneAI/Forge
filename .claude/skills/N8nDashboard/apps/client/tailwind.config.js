/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tokyo Night theme
        'bg': {
          'primary': '#1a1b26',
          'secondary': '#24283b',
          'tertiary': '#414868',
        },
        'text': {
          'primary': '#c0caf5',
          'secondary': '#a9b1d6',
          'tertiary': '#565f89',
        },
        'border': {
          'primary': '#414868',
          'secondary': '#565f89',
        },
        'accent': {
          'blue': '#7aa2f7',
          'purple': '#bb9af7',
          'cyan': '#7dcfff',
          'green': '#9ece6a',
          'orange': '#ff9e64',
          'red': '#f7768e',
        },
        // Status colors
        'status': {
          'success': '#9ece6a',
          'error': '#f7768e',
          'waiting': '#e0af68',
          'canceled': '#565f89',
          'active': '#9ece6a',
          'inactive': '#565f89',
        }
      },
    },
  },
  plugins: [],
};
