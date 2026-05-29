import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        surface: {
          base: '#111110',
          raised: '#1c1c1a',
          overlay: '#252522',
          border: '#2e2e2b',
        },
        text: {
          primary: '#e8e6e1',
          secondary: '#8a8680',
          muted: '#4a4845',
          accent: '#c9a96e',
        },
      },
      fontFamily: {
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        widest2: '0.12em',
      },
      borderRadius: {
        DEFAULT: '3px',
        sm: '2px',
        md: '3px',
      },
    },
  },
  plugins: [],
} satisfies Config