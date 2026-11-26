import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, User, Calendar } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AuthLayout } from '../components/AuthLayout'
import { Button, Input } from '@/shared/components/ui'
import { useRegister } from '../hooks/useAuth'

// Validação básica de CPF (algoritmo oficial)
function isValidCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i)
  let r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  if (r !== parseInt(digits[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i)
  r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  return r === parseInt(digits[10])
}

function formatCpf(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4')
}

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z
    .string()
    .min(8, 'Mínimo de 8 caracteres')
    .regex(/[A-Z]/, 'Use ao menos uma letra maiúscula')
    .regex(/[0-9]/, 'Use ao menos um número'),
  role:      z.enum(['TITULAR', 'APOIO']),
  cpf:       z.string().refine((v) => isValidCpf(v), 'CPF inválido'),
  birthDate: z
    .string()
    .min(1, 'Data de nascimento obrigatória')
    .refine((v) => new Date(v) < new Date(), 'Data deve estar no passado'),
  terms: z.literal(true, { errorMap: () => ({ message: 'Você precisa aceitar os termos' }) }),
})

type FormData = z.infer<typeof schema>

export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [cpfDisplay, setCpfDisplay]     = useState('')
  const register_ = useRegister()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'TITULAR' },
  })

  const role = watch('role')

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCpf(e.target.value)
    setCpfDisplay(formatted)
    setValue('cpf', formatted, { shouldValidate: true })
  }

  const onSubmit = (data: FormData) => {
    register_.mutate({
      email:     data.email,
      password:  data.password,
      role:      data.role,
      cpf:       data.cpf,
      birthDate: data.birthDate,
    })
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
            <p role="alert" className="text-xs text-danger mt-1">{errors.role.message}</p>
          )}
        </fieldset>

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

        {/* CPF */}
        <div>
          <label htmlFor="cpf-input" className="text-sm font-medium text-slate-300 block mb-1.5">
            CPF <span className="text-danger">*</span>
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-slate-500 pointer-events-none">
              <User size={15} />
            </span>
            <input
              id="cpf-input"
              type="text"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={cpfDisplay}
              onChange={handleCpfChange}
              maxLength={14}
              className={`w-full h-11 pl-9 pr-3 rounded-xl bg-glass border text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none transition-all ${
                errors.cpf ? 'border-danger/60 focus:border-danger' : 'border-glass-border focus:border-focus/50'
              }`}
              aria-invalid={!!errors.cpf}
              aria-describedby={errors.cpf ? 'cpf-error' : undefined}
            />
          </div>
          {errors.cpf && (
            <p id="cpf-error" role="alert" className="text-xs text-danger mt-1">{errors.cpf.message}</p>
          )}
        </div>

        {/* Data de nascimento */}
        <div>
          <label htmlFor="birth-input" className="text-sm font-medium text-slate-300 block mb-1.5">
            Data de nascimento <span className="text-danger">*</span>
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-slate-500 pointer-events-none">
              <Calendar size={15} />
            </span>
            <input
              id="birth-input"
              type="date"
              max={new Date().toISOString().split('T')[0]}
              className={`w-full h-11 pl-9 pr-3 rounded-xl bg-glass border text-sm text-slate-200 focus:outline-none transition-all ${
                errors.birthDate ? 'border-danger/60 focus:border-danger' : 'border-glass-border focus:border-focus/50'
              }`}
              aria-invalid={!!errors.birthDate}
              aria-describedby={errors.birthDate ? 'birth-error' : undefined}
              {...register('birthDate')}
            />
          </div>
          {errors.birthDate && (
            <p id="birth-error" role="alert" className="text-xs text-danger mt-1">{errors.birthDate.message}</p>
          )}
        </div>

        {/* Error from API */}
        {register_.isError && (
          <div role="alert" className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-xl p-3">
            {register_.error instanceof Error ? register_.error.message : 'Erro ao criar conta'}
          </div>
        )}

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
            <Link to="/terms" className="text-slate-400 hover:text-slate-200 underline">Termos de Uso</Link>{' '}
            e{' '}
            <Link to="/privacy" className="text-slate-400 hover:text-slate-200 underline">Política de Privacidade</Link>
            , incluindo o tratamento dos meus dados conforme a LGPD.
          </span>
        </label>
        {errors.terms && (
          <p role="alert" className="text-xs text-danger">{errors.terms.message}</p>
        )}

        <Button type="submit" variant="primary" size="lg" fullWidth loading={register_.isPending}>
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
