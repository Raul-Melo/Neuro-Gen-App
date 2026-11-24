import { Link } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'

export function TermsPage() {
  return (
    <div className="min-h-dvh bg-base-950 bg-mesh flex flex-col items-center justify-start p-6">
      <div className="w-full max-w-2xl mt-8">
        <Link
          to="/register"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors mb-6"
        >
          <ArrowLeft size={14} /> Voltar ao cadastro
        </Link>

        <div className="glass-card p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-focus-muted flex items-center justify-center">
              <FileText size={18} className="text-focus-light" aria-hidden />
            </div>
            <div>
              <h1 className="font-display font-bold text-slate-100 text-xl">Termos de Uso</h1>
              <p className="text-xs text-slate-500">Última atualização: 2026</p>
            </div>
          </div>

          <div className="space-y-4 text-sm text-slate-400 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-slate-200 font-semibold">1. Aceitação dos Termos</h2>
              <p>
                Ao criar uma conta no Neuro-Gen, você concorda com estes Termos de Uso e com nossa
                Política de Privacidade. O uso contínuo do aplicativo constitui aceitação de quaisquer
                atualizações.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-slate-200 font-semibold">2. Descrição do Serviço</h2>
              <p>
                O Neuro-Gen é uma agenda adaptativa para pessoas neurodivergentes, oferecendo
                ferramentas de organização, foco e regulação emocional. O serviço não substitui
                acompanhamento médico, psicológico ou terapêutico.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-slate-200 font-semibold">3. Uso Responsável</h2>
              <p>
                Você é responsável por manter a confidencialidade de suas credenciais. É proibido
                usar o serviço para fins ilegais, difamatórios ou que violem direitos de terceiros.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-slate-200 font-semibold">4. Dados Sensíveis</h2>
              <p>
                Informações de saúde e neurodivergência são tratadas como dados sensíveis conforme
                a LGPD (Lei nº 13.709/2018). Consulte nossa Política de Privacidade para detalhes
                sobre coleta, uso e proteção dessas informações.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-slate-200 font-semibold">5. Propriedade Intelectual</h2>
              <p>
                Todo o conteúdo, design e código do Neuro-Gen são propriedade exclusiva de seus
                desenvolvedores. É proibida a reprodução sem autorização.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-slate-200 font-semibold">6. Limitação de Responsabilidade</h2>
              <p>
                O Neuro-Gen é fornecido "como está". Não garantimos disponibilidade ininterrupta.
                Não nos responsabilizamos por danos indiretos decorrentes do uso.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-slate-200 font-semibold">7. Contato</h2>
              <p>
                Dúvidas sobre estes termos? Entre em contato:{' '}
                <span className="text-focus-light">suporte@neuro-gen.app</span>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
