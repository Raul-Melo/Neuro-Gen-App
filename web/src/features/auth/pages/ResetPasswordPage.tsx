import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AuthLayout } from '../components/AuthLayout'
import { Button, Input } from '@/shared/components/ui'
import { authService } from '../services/auth.service'
import { useUIStore } from '@/shared/stores/ui.store'

const schema = z.object({
  password: z
    .string()
    .min(8, 'Mínimo de 8 caracteres')
    .regex(/[A-Z]/, 'Use ao menos uma letra maiúscula')
    .regex(/[0-9]/, 'Use ao menos um número'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'As senhas não coincidem',
  path: ['confirm'],
})

type FormData = z.infer<typeof schema>

export function ResetPasswordPage() {
  const [searchParams]          = useSearchParams()
  const navigate                = useNavigate()
  const addToast                = useUIStore((s) => s.addToast)
  const [showPassword, setShow] = useState(false)
  const [loading, setLoading]   = useState(false)

  const token = searchParams.get('token')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    if (!token) {
      addToast({ variant: 'error', message: 'Link inválido ou expirado.' })
      return
    }
    setLoading(true)
    try {
      await authService.confirmPasswordReset(token, data.password)
      addToast({ variant: 'success', message: 'Senha redefinida com sucesso! Faça login.', duration: 5000 })
      navigate('/login')
    } catch {
      addToast({ variant: 'error', message: 'Link inválido ou expirado. Solicite um novo.' })
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <AuthLayout title="Link inválido" subtitle="Este link é inválido ou já expirou">
        <div className="text-center space-y-4">
          <p className="text-sm text-slate-400">
            Solicite um novo link de redefinição de senha.
          </p>
          <Link
            to="/forgot-password"
            className="inline-flex items-center gap-2 text-sm text-focus-light hover:text-focus transition-colors"
          >
            Solicitar novo link
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Nova senha" subtitle="Crie uma senha segura para sua conta">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input
          label="Nova senha"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Mín. 8 caracteres"
          leftIcon={<Lock size={15} />}
          helperText="Ao menos 8 caracteres, 1 maiúscula e 1 número"
          error={errors.password?.message}
          required
          rightElement={
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          }
          {...register('password')}
        />

        <Input
          label="Confirmar nova senha"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Repita a senha"
          leftIcon={<Lock size={15} />}
          error={errors.confirm?.message}
          required
          {...register('confirm')}
        />

        <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
          Redefinir senha
        </Button>

        <p className="text-center text-sm text-slate-500">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft size={13} /> Voltar para o login
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
