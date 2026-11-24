import type { Config } from 'tailwindcss'

/**
 * Design system derivado da paleta da logo Neuro-Gen v2:
 * Cérebro + Calendário · azul-royal (#2563eb) → violeta (#7c3aed) → rosa-neural (#c084fc)
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // ── Superfícies (dark navy extraído do fundo implícito da logo)
        base: {
          950: '#03040d',
          900: '#06080f',
          800: '#0a0d1a',
          700: '#0f1326',
          600: '#141931',
          500: '#1a2040',
        },

        // ── Tokens de vidro (glassmorphism)
        glass: 'rgba(255,255,255,0.04)',
        'glass-hover': 'rgba(255,255,255,0.07)',
        'glass-border': 'rgba(255,255,255,0.08)',
        'glass-border-hover': 'rgba(255,255,255,0.15)',

        // ── Marca principal (azul-royal da logo)
        brand: {
          DEFAULT: '#2563eb',
          light: '#60a5fa',
          dark: '#1d4ed8',
          muted: 'rgba(37,99,235,0.14)',
          subtle: 'rgba(37,99,235,0.07)',
        },

        // ── Módulo Agenda · periwinkle/azul calendário
        agenda: {
          DEFAULT: '#6366f1',
          light: '#a5b4fc',
          dark: '#4f46e5',
          muted: 'rgba(99,102,241,0.12)',
        },

        // ── Módulo Foco · violeta (nó neural escuro)
        focus: {
          DEFAULT: '#7c3aed',
          light: '#c084fc',
          dark: '#6d28d9',
          muted: 'rgba(124,58,237,0.12)',
        },

        // ── Módulo Emocional · teal-cyan
        emotional: {
          DEFAULT: '#0891b2',
          light: '#22d3ee',
          dark: '#0e7490',
          muted: 'rgba(8,145,178,0.12)',
        },

        // ── Módulo Cofre · âmbar/dourado
        vault: {
          DEFAULT: '#d97706',
          light: '#fbbf24',
          dark: '#b45309',
          muted: 'rgba(217,119,6,0.12)',
        },

        // ── Módulo Vínculos · rosa-neural (nós da logo)
        link: {
          DEFAULT: '#a855f7',
          light: '#d8b4fe',
          dark: '#9333ea',
          muted: 'rgba(168,85,247,0.12)',
        },

        // ── Danger
        danger: {
          DEFAULT: '#ef4444',
          light: '#fca5a5',
          dark: '#dc2626',
          muted: 'rgba(239,68,68,0.12)',
        },

        // ── Success
        success: {
          DEFAULT: '#22c55e',
          light: '#86efac',
          muted: 'rgba(34,197,94,0.12)',
        },
      },

      backgroundImage: {
        // Gradiente principal da marca (espelha logo)
        'brand-gradient': 'linear-gradient(135deg, #1d4ed8 0%, #7c3aed 50%, #c084fc 100%)',
        'brand-gradient-soft': 'linear-gradient(135deg, rgba(29,78,216,0.3) 0%, rgba(124,58,237,0.3) 100%)',
        // Mesh ambiente — reflete o brilho da logo
        'mesh-brand':
          'radial-gradient(at 15% 25%, rgba(37,99,235,0.18) 0%, transparent 55%), ' +
          'radial-gradient(at 85% 75%, rgba(124,58,237,0.14) 0%, transparent 55%), ' +
          'radial-gradient(at 50% 10%, rgba(192,132,252,0.08) 0%, transparent 50%)',
      },

      boxShadow: {
        'glass': '0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
        'glass-lg': '0 8px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)',
        'glow-brand': '0 0 24px rgba(37,99,235,0.35)',
        'glow-violet': '0 0 24px rgba(124,58,237,0.35)',
        'glow-pink': '0 0 24px rgba(192,132,252,0.30)',
        'glow-indigo': '0 0 20px rgba(99,102,241,0.30)',
        'glow-cyan': '0 0 20px rgba(34,211,238,0.28)',
        'glow-amber': '0 0 20px rgba(251,191,36,0.28)',
      },

      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'slide-in-left': 'slideInLeft 0.25s ease-out',
        'pulse-soft': 'pulseSoft 2.5s ease-in-out infinite',
        'float': 'float 4s ease-in-out infinite',
        'gradient-shift': 'gradientShift 6s ease-in-out infinite alternate',
      },

      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-14px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        gradientShift: {
          from: { backgroundPosition: '0% 50%' },
          to: { backgroundPosition: '100% 50%' },
        },
      },

      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}

export default config
