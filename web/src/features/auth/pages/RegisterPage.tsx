import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AuthLayout } from '../components/AuthLayout'
import { Button, Input } from '@/shared/components/ui'
import { useRegister } from '../hooks/useAuth'

const schema = z.object({
  name: z.string().min(2, 'Nome muito curto').max(100, 'Nome muito longo'),
  email: z.string().email('E-mail inválido'),
  password: z
    .string()
    .min(8, 'Mínimo de 8 caracteres')
    .regex(/[A-Z]/, 'Use ao menos uma letra maiúscula')
    .regex(/[0-9]/, 'Use ao menos um número'),
  role: z.enum(['TITULAR', 'APOIO']),
  terms: z.literal(true, { errorMap: () => ({ message: 'Você precisa aceitar os termos' }) }),
})

type FormData = z.infer<typeof schema>

export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const register_ = useRegister()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'TITULAR' },
  })

  const role = watch('role')

  const onSubmit = (data: FormData) => {
    register_.mutate({ name: data.name, email: data.email, password: data.password, role: data.role })
  }

  return (
    <AuthLayout title="Criar sua conta" subtitle="Comece sua jornada com o Neuro-Gen">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* Role selector */}
        <fieldset>
          <legend className="text-sm font-medium text-slate-300 mb-2">
            Tipo de conta <span className="text-danger">*</span>
          </legend>
          <div className="grid grid-cols-2 gap-2" role="radiogroup">
            {(['TITULAR', 'APOIO'] as const).map((r) => (
              <label
                key={r}
                className={`flex flex-col gap-1 p-3 rounded-xl border cursor-pointer transition-all duration-150 ${
                  role === r
                    ? 'border-focus/50 bg-focus-muted'
                    : 'border-glass-border bg-glass hover:bg-glass-hover'
                }`}
              >
                <input type="radio" value={r} className="sr-only" {...register('role')} />
                <span className="text-sm font-medium text-slate-200">
                  {r === 'TITULAR' ? 'Titular' : 'Apoio'}
                </span>
                <span className="text-xs text-slate-500">
                  {r === 'TITULAR'
                    ? 'Neurodivergente, dono dos dados'
                    : 'Familiar, terapeuta ou parceiro(a)'}
                </span>
              </label>
            ))}
          </div>
          {errors.role && (
            <p role="alert" className="text-xs text-danger mt-1">
              {errors.role.message}
            </p>
          )}
        </fieldset>

        <Input
          label="Nome completo"
          type="text"
          autoComplete="name"
          placeholder="Seu nome"
          leftIcon={<User size={15} />}
          error={errors.name?.message}
          required
          {...register('name')}
        />

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
          autoComplete="new-password"
          placeholder="Mín. 8 caracteres"
          leftIcon={<Lock size={15} />}
          error={errors.password?.message}
          helperText="Ao menos 8 caracteres, 1 maiúscula e 1 número"
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

        {/* Terms */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5 w-4 h-4 rounded accent-focus"
            aria-required="true"
            {...register('terms')}
          />
          <span className="text-xs text-slate-500 leading-relaxed">
            Concordo com os{' '}
            <Link to="/terms" className="text-slate-400 hover:text-slate-200 underline">
              Termos de Uso
            </Link>{' '}
            e{' '}
            <Link to="/privacy" className="text-slate-400 hover:text-slate-200 underline">
              Política de Privacidade
            </Link>
            , incluindo o tratamento dos meus dados conforme a LGPD.
          </span>
        </label>
        {errors.terms && (
          <p role="alert" className="text-xs text-danger">
            {errors.terms.message}
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={register_.isPending}
        >
          Criar conta
        </Button>

        <p className="text-center text-sm text-slate-500">
          Já tem conta?{' '}
          <Link to="/login" className="text-focus-light hover:text-focus font-medium transition-colors">
            Entrar
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
