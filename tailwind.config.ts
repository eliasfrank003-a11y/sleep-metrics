import type { Config } from 'tailwindcss';

export default {
  // Class-based so the in-app toggle wins, with dark as the default.
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        destructive: 'hsl(var(--destructive))',
        sleep: {
          DEFAULT: 'hsl(var(--sleep))',
          edge: 'hsl(var(--sleep-edge))',
          track: 'hsl(var(--sleep-track))',
        },
        daylight: 'hsl(var(--daylight))',
        night: 'hsl(var(--night-wash))',
      },
      borderRadius: {
        lg: '0.75rem',
      },
    },
  },
  plugins: [],
} satisfies Config;
