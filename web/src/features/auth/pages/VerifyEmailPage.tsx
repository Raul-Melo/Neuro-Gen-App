import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Mail, CheckCircle2, ArrowLeft, Copy, Check, RefreshCw, KeyRound } from 'lucide-react'
import { AuthLayout } from '../components/AuthLayout'
import { Button, Input } from '@/shared/components/ui'
import { authService } from '../services/auth.service'
import { useUIStore } from '@/shared/stores/ui.store'
import { cn } from '@/shared/lib/cn'

type Phase = 'loading' | 'token-display' | 'token-input' | 'success' | 'error'

export function VerifyEmailPage() {
  const [searchParams]    = useSearchParams()
  const navigate          = useNavigate()
  const addToast          = useUIStore((s) => s.addToast)

  const email = searchParams.get('email') ?? ''

  const [phase, setPhase]         = useState<Phase>(email ? 'loading' : 'token-input')
  const [devToken, setDevToken]   = useState('')
  const [copied, setCopied]       = useState(false)
  const [token, setToken]         = useState('')
  const [verifying, setVerifying] = useState(false)
  const [error, setError]         = useState('')

  // Auto-fetch token from /dev/verification-token when email is known
  const fetchDevToken = useCallback(async () => {
    if (!import.meta.env.DEV || !email) { setPhase('token-input'); return }
    setPhase('loading')
    try {
      const data = await authService.getDevVerificationToken(email)
      setDevToken(data.verificationToken)
      setPhase('token-display')
    } catch {
      setPhase('token-input')
    }
  }, [email])

  useEffect(() => { fetchDevToken() }, [fetchDevToken])

  const handleCopy = async () => {
    if (!devToken) return
    try {
      await navigator.clipboard.writeText(devToken)
      setToken(devToken)        // preenche o campo de input automaticamente
      setCopied(true)
      setDevToken('')            // token some da tela após copiar
      setTimeout(() => { setCopied(false); setPhase('token-input') }, 1200)
    } catch {
      // fallback: só avança para input
      setToken(devToken)
      setDevToken('')
      setPhase('token-input')
    }
  }

  const handleVerify = async () => {
    const t = token.trim()
    if (!t) { setError('Cole o código de verificação'); return }
    setVerifying(true); setError('')
    try {
      await authService.verifyEmail(t)
      setPhase('success')
      setTimeout(() => {
        addToast({ variant: 'success', message: 'E-mail verificado! Faça login para continuar.' })
        navigate('/login')
      }, 1800)
    } catch {
      setError('Código inválido ou expirado. Tente gerar um novo código.')
      setVerifying(false)
    }
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if (phase === 'success') {
    return (
      <AuthLayout title="E-mail verificado!" subtitle="Sua conta está ativa">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emotional-muted border border-emotional/20 flex items-center justify-center mx-auto animate-pulse">
            <CheckCircle2 size={28} className="text-emotional" />
          </div>
          <p className="text-sm text-slate-400">
            Conta ativada com sucesso. Redirecionando para o login…
          </p>
          <Link to="/login">
            <Button variant="primary" size="lg" fullWidth>
              Ir para o login
            </Button>
          </Link>
        </div>
      </AuthLayout>
    )
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <AuthLayout title="Verificar e-mail" subtitle="Buscando código de ativação…">
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="w-10 h-10 rounded-full border-2 border-focus border-t-transparent animate-spin" />
          <p className="text-sm text-slate-500">Aguarde…</p>
        </div>
      </AuthLayout>
    )
  }

  // ── Token display (one-time, copy-and-disappear) ───────────────────────────
  if (phase === 'token-display' && devToken) {
    return (
      <AuthLayout title="Código de ativação" subtitle={`Para ${email}`}>
        <div className="space-y-5">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-glass border border-glass-border">
            <Mail size={16} className="text-focus-light mt-0.5 flex-shrink-0" />
            <p className="text-xs text-slate-400">
              Copie o código abaixo. Ele <strong className="text-slate-200">desaparece</strong> após ser copiado — cole no campo de verificação.
            </p>
          </div>

          {/* Token display block */}
          <div className="relative group">
            <div className="rounded-xl border border-vault/30 bg-vault-muted/20 p-5">
              <p className="text-[10px] uppercase tracking-widest text-vault-light mb-3 font-mono">
                Código de verificação
              </p>
              <code
                className="block font-mono text-sm text-slate-100 break-all leading-relaxed select-all"
                aria-label="Código de verificação — clique para selecionar"
              >
                {devToken}
              </code>
            </div>

            {/* Copy button */}
            <button
              onClick={handleCopy}
              aria-label="Copiar código e continuar"
              className={cn(
                'absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                copied
                  ? 'bg-emotional text-white'
                  : 'bg-vault text-white hover:bg-vault/90',
              )}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copiado!' : 'Copiar código'}
            </button>
          </div>

          <p className="text-xs text-slate-600 text-center">
            O código desaparece após a cópia — isso é intencional.
          </p>
        </div>
      </AuthLayout>
    )
  }

  // ── Token input (after copy or fallback) ──────────────────────────────────
  return (
    <AuthLayout title="Verificar e-mail" subtitle="Cole o código de ativação">
      <div className="space-y-5">
        {!email && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-glass border border-glass-border">
            <Mail size={16} className="text-focus-light mt-0.5 flex-shrink-0" />
            <p className="text-xs text-slate-400">
              Em desenvolvimento, obtenha o código nos logs do servidor{' '}
              (<code className="text-focus-light">[EMAIL]</code> ou <code className="text-focus-light">verificação</code>).
            </p>
          </div>
        )}

        {email && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-glass border border-glass-border">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <KeyRound size={14} className="text-vault-light" />
              <span>Cole o código copiado para <strong className="text-slate-300">{email}</strong></span>
            </div>
            <button
              onClick={fetchDevToken}
              aria-label="Gerar novo código"
              title="Gerar novo código"
              className="text-slate-500 hover:text-slate-200 transition-colors"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        )}

        <Input
          label="Código de verificação"
          placeholder="Cole o código aqui"
          value={token}
          onChange={(e) => { setToken(e.target.value); setError('') }}
          error={error}
          autoFocus={!token}
        />

        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={verifying}
          onClick={handleVerify}
        >
          Ativar conta
        </Button>

        <Link
          to="/login"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ArrowLeft size={14} /> Voltar ao login
        </Link>
      </div>
    </AuthLayout>
  )
}
