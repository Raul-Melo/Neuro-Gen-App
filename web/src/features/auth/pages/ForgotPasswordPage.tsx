import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AuthLayout } from '../components/AuthLayout'
import { Button, Input } from '@/shared/components/ui'
import { authService } from '../services/auth.service'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
})

type FormData = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading]     = useState(false)

  const { register, handleSubmit, formState: { errors }, getValues } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      await authService.requestPasswordReset(data.email)
    } catch {
      // Sempre mostra sucesso — backend não confirma existência do e-mail (segurança)
    } finally {
      setLoading(false)
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <AuthLayout title="Verifique seu e-mail" subtitle="Instruções de redefinição enviadas">
        <div className="text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-emotional-muted border border-emotional/20 flex items-center justify-center mx-auto">
            <CheckCircle2 size={28} className="text-emotional" aria-hidden />
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            Se existe uma conta com o e-mail{' '}
            <span className="text-slate-200 font-medium">{getValues('email')}</span>,
            você receberá um link para redefinir sua senha em breve.
          </p>
          <p className="text-xs text-slate-600">
            Não recebeu? Verifique a pasta de spam ou aguarde alguns minutos.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-focus-light hover:text-focus transition-colors"
          >
            <ArrowLeft size={14} /> Voltar para o login
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Redefinir senha"
      subtitle="Informe seu e-mail e enviaremos as instruções"
    >
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

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
        >
          Enviar instruções
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
