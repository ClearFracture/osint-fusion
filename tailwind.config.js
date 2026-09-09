/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        tactical: {
          bg: '#1a1f16',
          panel: '#2d3a2a',
          border: '#4a5c42',
          text: '#c8d4bc',
          muted: '#8b9a7a',
          gold: '#c4a035',
          danger: '#8b3a3a',
          ready: '#3d6b4f',
        },
      },
      fontFamily: {
        display: ['Rajdhani', 'sans-serif'],
        body: ['"Source Sans 3"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
