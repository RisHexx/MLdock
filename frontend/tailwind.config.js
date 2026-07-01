/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#2563EB', // blue-600
          hover: '#1D4ED8',   // blue-700
        },
        surface: '#F9FAFB',
        border: '#E5E7EB',
      },
      spacing: {
        // 8px spacing system is already standard in Tailwind (1 = 0.25rem = 4px, 2 = 8px)
      },
      borderRadius: {
        card: '10px',
        input: '8px',
        btn: '8px',
      },
      boxShadow: {
        soft: '0 1px 3px rgba(0,0,0,0.08)',
      }
    },
  },
  plugins: [],
}
