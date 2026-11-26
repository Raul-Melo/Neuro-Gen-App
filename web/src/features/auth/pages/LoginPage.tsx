import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AuthLayout } from '../components/AuthLayout'
import { Button, Input } from '@/shared/components/ui'
import { useLogin } from '../hooks/useAuth'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
  totpCode: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [needsTotp, setNeedsTotp] = useState(false)
  const login = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = (data: FormData) => {
    login.mutate(data, {
      onError: (err: unknown) => {
        const axiosErr = err as { response?: { data?: { code?: string } } }
        if (axiosErr.response?.data?.code === 'TOTP_REQUIRED') {
          setNeedsTotp(true)
        }
      },
    })
  }

  return (
    <AuthLayout title="Bem-vindo de volta" subtitle="Entre na sua conta para continuar">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input
          label="E-mail"
          type="email"
          autoComplete="email"
          placeholder="seu@email.com"
          leftIcon={<Mail size={15} />}
          error={errors.email?.message}
          required
          {...register('email')}
        />

        <Input
          label="Senha"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="••••••••"
          leftIcon={<Lock size={15} />}
          error={errors.password?.message}
          required
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          }
          {...register('password')}
        />

        {needsTotp && (
          <Input
            label="Código de autenticação (2FA)"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            autoComplete="one-time-code"
            error={errors.totpCode?.message}
            helperText="Abra seu app autenticador e insira o código de 6 dígitos"
            required
            {...register('totpCode')}
          />
        )}

        <div className="flex items-center justify-end">
          <Link
            to="/forgot-password"
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Esqueceu a senha?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={login.isPending}
        >
          Entrar
        </Button>

        <p className="text-center text-sm text-slate-500">
          Não tem conta?{' '}
          <Link to="/register" className="text-focus-light hover:text-focus font-medium transition-colors">
            Criar conta
          </Link>
        </p>

        {login.isError && (
          <p role="alert" className="text-xs text-center text-slate-500 mt-1">
            Conta em análise? Verifique seu e-mail e clique no link de ativação.
          </p>
        )}
      </form>
    </AuthLayout>
  )
}
