import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './content/**/*.{md,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#080b10',
        surface: '#111720',
        panel: '#151d28',
        'panel-2': '#1a2431',
        border: '#263242',
        neon: '#4ade80',
        cyan: '#38bdf8',
        amber: '#f59e0b',
        muted: '#8a95a6',
        dim: '#3a4554',
        ink: '#e6edf3',
      },
      fontFamily: {
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
