import defaultColors from 'tailwindcss/colors';
import plugin from 'tailwindcss/plugin';

/*
 * Dark mode works by turning the palette into CSS variables.
 *
 * Every page uses plain classes like `bg-white`, `text-gray-900`, `bg-red-50`.
 * Instead of adding `dark:` variants to each of them, the gray and accent
 * palettes below point at CSS variables. `:root` holds the normal Tailwind
 * values; `.dark` (set on <html>) swaps them, so the same classes render dark.
 */

const SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
const ACCENTS = ['red', 'green', 'blue', 'yellow', 'purple', 'indigo'];

// Dark-mode gray: light text on dark backgrounds, but backgrounds like
// bg-gray-50 / bg-gray-100 (table headers, hovers) stay slightly *lighter* than cards.
const DARK_GRAY = {
  50: '#1f2937', 100: '#1f2937', 200: '#374151', 300: '#4b5563', 400: '#6b7280',
  500: '#9ca3af', 600: '#d1d5db', 700: '#e5e7eb', 800: '#f3f4f6', 900: '#f9fafb', 950: '#ffffff',
};

// Dark-mode accents: swap the light tints (50-200) with the deep shades (800-950)
// so badges/alerts get dark backgrounds with light text. Mid shades stay close to
// normal (600 -> 500 for a little extra contrast on dark), so buttons like
// bg-red-600 with white text stay readable.
const ACCENT_DARK_MAP = {
  50: '950', 100: '900', 200: '800', 300: '300', 400: '400', 500: '500',
  600: '500', 700: '300', 800: '200', 900: '100', 950: '50',
};

const toRgb = (hex) => {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(' ');
};

const varPalette = (name) =>
  Object.fromEntries(SHADES.map((s) => [s, `rgb(var(--c-${name}-${s}) / <alpha-value>)`]));

const themeVars = () => {
  const light = {};
  const dark = {};
  for (const s of SHADES) {
    light[`--c-gray-${s}`] = toRgb(defaultColors.gray[s]);
    dark[`--c-gray-${s}`] = toRgb(DARK_GRAY[s]);
    for (const c of ACCENTS) {
      light[`--c-${c}-${s}`] = toRgb(defaultColors[c][s]);
      dark[`--c-${c}-${s}`] = toRgb(defaultColors[c][ACCENT_DARK_MAP[s]]);
    }
  }
  // App tokens: page background, card background, borders
  Object.assign(light, { '--c-surface': toRgb('#F9FAFB'), '--c-card': toRgb('#FFFFFF'), '--c-border': toRgb('#E5E7EB') });
  Object.assign(dark, { '--c-surface': toRgb('#0b1120'), '--c-card': toRgb('#111827'), '--c-border': toRgb('#1f2937') });
  return { light, dark };
};

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
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
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        card: 'rgb(var(--c-card) / <alpha-value>)',
        border: 'rgb(var(--c-border) / <alpha-value>)',
        gray: varPalette('gray'),
        ...Object.fromEntries(ACCENTS.map((c) => [c, varPalette(c)])),
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
  plugins: [
    plugin(({ addBase }) => {
      const { light, dark } = themeVars();
      addBase({
        ':root': { ...light, colorScheme: 'light' },
        // color-scheme makes native controls (inputs, selects, scrollbars) dark too
        '.dark': { ...dark, colorScheme: 'dark' },
      });
    }),
  ],
}
