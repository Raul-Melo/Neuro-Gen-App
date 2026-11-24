import { Link } from 'react-router-dom'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-dvh bg-base-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glows from brand gradient */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center top, rgba(37,99,235,0.14) 0%, transparent 70%)',
        }}
        aria-hidden
      />
      <div
        className="absolute bottom-0 right-0 w-[400px] h-[300px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at bottom right, rgba(124,58,237,0.10) 0%, transparent 70%)',
        }}
        aria-hidden
      />

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 justify-center mb-8 group" aria-label="Neuro-Gen — Página inicial">
          <img
            src="/logo-64.webp"
            alt="Neuro-Gen logo"
            width={44}
            height={44}
            className="w-11 h-11 drop-shadow-[0_0_12px_rgba(124,58,237,0.5)] group-hover:scale-105 transition-transform duration-200"
          />
          <span className="font-display font-bold text-xl tracking-tight text-brand-gradient">
            Neuro-Gen
          </span>
        </Link>

        {/* Card */}
        <div className="glass-card p-5 sm:p-8 border-brand-gradient">
          <div className="mb-6">
            <h1 className="font-display font-semibold text-slate-100 text-2xl">{title}</h1>
            {subtitle && (
              <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">{subtitle}</p>
            )}
          </div>

          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 mt-6">
          Seus dados são protegidos conforme a{' '}
          <Link to="/privacy" className="text-slate-500 hover:text-slate-300 underline underline-offset-2">
            Política de Privacidade
          </Link>{' '}
          e a LGPD.
        </p>
      </div>
    </div>
  )
}
