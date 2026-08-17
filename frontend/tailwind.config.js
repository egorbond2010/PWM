export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gis: {
          bg: '#0a0d14',
          card: '#111726',
          panel: '#151d30',
          border: '#1f2b45',
          sideA: '#3b82f6',
          sideB: '#ef4444',
          contested: '#eab308',
          unconfirmed: '#6b7280',
          accent: '#06b6d4',
          diffGain: '#10b981',
          diffLoss: '#f43f5e',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'hud': '0 0 20px rgba(6, 182, 212, 0.15)',
        'neon-blue': '0 0 15px rgba(59, 130, 246, 0.5)',
        'neon-red': '0 0 15px rgba(239, 68, 68, 0.5)',
        'neon-yellow': '0 0 15px rgba(234, 179, 8, 0.5)',
      }
    },
  },
  plugins: [],
}
