/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        "sans": ["Inter", "system-ui", "-apple-system", "sans-serif"],
        "mono": ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        // Tokyo Night inspired palette
        'bg': {
          'primary': '#1a1b26',
          'secondary': '#24283b',
          'tertiary': '#414868',
        },
        'text': {
          'primary': '#ffffff',
          'secondary': '#d1d5e8',
          'tertiary': '#9aa1c0',
        },
        'border': {
          'primary': '#414868',
          'secondary': '#565f89',
        },
        // Security severity colors
        'severity': {
          'critical': '#f7768e',
          'critical-bg': 'rgba(247, 118, 142, 0.15)',
          'high': '#e0af68',
          'high-bg': 'rgba(224, 175, 104, 0.15)',
          'medium': '#bb9af7',
          'medium-bg': 'rgba(187, 154, 247, 0.15)',
          'low': '#9ece6a',
          'low-bg': 'rgba(158, 206, 106, 0.15)',
        },
        // Accent colors
        'accent': {
          'blue': '#7aa2f7',
          'cyan': '#7dcfff',
          'green': '#9ece6a',
          'magenta': '#bb9af7',
        },
      },
    },
  },
  plugins: [],
}
