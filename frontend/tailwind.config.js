/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        forge: {
          bg: "#0A0A0F",
          card: "#12121A",
          border: "#1E1E2E",
          accent: "#6EE7B7",
          orange: "#F97316",
          purple: "#A855F7",
          blue: "#3B82F6",
          text: "#E2E8F0",
          muted: "#64748B",
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.4s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        glow: {
          from: { boxShadow: '0 0 10px rgba(110,231,183,0.3)' },
          to: { boxShadow: '0 0 25px rgba(110,231,183,0.6)' }
        },
        slideUp: {
          from: { opacity: 0, transform: 'translateY(20px)' },
          to: { opacity: 1, transform: 'translateY(0)' }
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 }
        }
      }
    }
  },
  plugins: []
}
