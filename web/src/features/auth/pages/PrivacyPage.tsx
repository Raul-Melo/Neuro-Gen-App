import { Link } from 'react-router-dom'
import { ArrowLeft, Shield } from 'lucide-react'

export function PrivacyPage() {
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
            <div className="w-10 h-10 rounded-xl bg-emotional-muted flex items-center justify-center">
              <Shield size={18} className="text-emotional" aria-hidden />
            </div>
            <div>
              <h1 className="font-display font-bold text-slate-100 text-xl">Política de Privacidade</h1>
              <p className="text-xs text-slate-500">Última atualização: 2026 — Conformidade LGPD</p>
            </div>
          </div>

          <div className="space-y-4 text-sm text-slate-400 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-slate-200 font-semibold">1. Dados Coletados</h2>
              <p>
                Coletamos: e-mail, senha (hash Argon2id), perfil de neurodivergência (opcional),
                tarefas e eventos criados, check-ins emocionais, e dados de sessões de foco.
                O Cofre de Senhas usa criptografia zero-knowledge — nunca temos acesso ao seu conteúdo.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-slate-200 font-semibold">2. Dados Sensíveis (LGPD Art. 5º, II)</h2>
              <p>
                Informações sobre saúde e neurodivergência são dados sensíveis. São armazenados com
                criptografia AES-256-GCM em nível de coluna e nunca compartilhados com terceiros
                sem seu consentimento explícito.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-slate-200 font-semibold">3. Uso dos Dados</h2>
              <p>
                Seus dados são usados exclusivamente para: (a) fornecer o serviço, (b) personalizar
                sugestões de foco e agenda com base no seu perfil, (c) permitir que sua rede de apoio
                acesse as informações que você autorizar.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-slate-200 font-semibold">4. Acesso por Terceiros (Apoio)</h2>
              <p>
                Contas de Apoio só acessam o que o Titular autoriza explicitamente por módulo
                (Agenda, Foco, Emocional). O Cofre de Senhas é bloqueado estruturalmente para
                qualquer conta Apoio, sem exceções.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-slate-200 font-semibold">5. Retenção e Exclusão</h2>
              <p>
                Você pode solicitar exclusão completa da conta e dados a qualquer momento nas
                Configurações. Dados são removidos em até 30 dias após a solicitação, exceto
                quando obrigação legal exigir retenção.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-slate-200 font-semibold">6. Seus Direitos (LGPD)</h2>
              <p>
                Você tem direito a: acesso, correção, portabilidade, anonimização, bloqueio e
                eliminação dos seus dados. Para exercer qualquer direito, contate:{' '}
                <span className="text-emotional">privacidade@neuro-gen.app</span>
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-slate-200 font-semibold">7. Cookies e Armazenamento Local</h2>
              <p>
                Usamos localStorage para manter sua sessão e preferências de interface.
                Nenhum cookie de rastreamento ou publicidade é utilizado.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
