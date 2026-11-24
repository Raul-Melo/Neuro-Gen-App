import { useState } from 'react'
import { Users, Plus, Shield, Clock, CheckCircle2, XCircle, Eye, Trash2, CalendarDays, Timer, Heart, Copy } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Card, Badge, Avatar, Modal, Spinner } from '@/shared/components/ui'
import { linksService, type LinkItem } from '../services/links.service'
import { useUIStore } from '@/shared/stores/ui.store'
import { cn } from '@/shared/lib/cn'

const permissionConfig: Record<string, { label: string; variant: 'agenda' | 'focus' | 'emotional'; icon: React.ElementType }> = {
  AGENDA:    { label: 'Agenda',   variant: 'agenda',    icon: CalendarDays },
  FOCUS:     { label: 'Foco',     variant: 'focus',     icon: Timer },
  EMOTIONAL: { label: 'Emocional',variant: 'emotional', icon: Heart },
}

const statusConfig = {
  ACTIVE:  { label: 'Ativo',     variant: 'emotional' as const, icon: CheckCircle2 },
  PENDING: { label: 'Pendente',  variant: 'vault'     as const, icon: Clock },
  REVOKED: { label: 'Revogado',  variant: 'danger'    as const, icon: XCircle },
}

const ALL_PERMISSIONS = ['AGENDA', 'FOCUS', 'EMOTIONAL']

function LinkDetailModal({
  link,
  onClose,
  onRevoke,
  onUpdatePermissions,
}: {
  link: LinkItem
  onClose: () => void
  onRevoke: () => void
  onUpdatePermissions: (perms: string[]) => void
}) {
  const [perms, setPerms] = useState<string[]>(link.permissions)

  const toggle = (p: string) =>
    setPerms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])

  return (
    <Modal open onClose={onClose} title={link.apoioName} description={link.apoioEmail}>
      <div className="space-y-5">
        {/* Status */}
        <div className="flex items-center gap-2">
          <span className="label-muted">Status:</span>
          {(() => {
            const cfg = statusConfig[link.status]
            const Icon = cfg.icon
            return <Badge variant={cfg.variant}><Icon size={11} aria-hidden />{cfg.label}</Badge>
          })()}
        </div>

        {/* Permissions */}
        {link.status === 'ACTIVE' && (
          <div>
            <p className="label-muted mb-2">Permissões de acesso</p>
            <div className="grid grid-cols-3 gap-2" role="group" aria-label="Permissões">
              {ALL_PERMISSIONS.map((p) => {
                const cfg  = permissionConfig[p]
                const Icon = cfg.icon
                const on   = perms.includes(p)
                return (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(p)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs transition-all duration-150',
                      on
                        ? 'border-focus/50 bg-focus-muted text-slate-200'
                        : 'border-glass-border bg-glass text-slate-500 hover:bg-glass-hover',
                    )}
                  >
                    <Icon size={16} aria-hidden />
                    {cfg.label}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Cofre nunca é compartilhado, independentemente das permissões.
            </p>
          </div>
        )}

        {link.lastAccessAt && (
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <Clock size={11} aria-hidden />
            Último acesso: {new Date(link.lastAccessAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
          </p>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-glass-border">
          {link.status !== 'REVOKED' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRevoke}
              className="text-danger hover:text-danger"
            >
              <Trash2 size={14} /> Revogar vínculo
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            {link.status === 'ACTIVE' && (
              <Button
                variant="primary"
                onClick={() => { onUpdatePermissions(perms); onClose() }}
              >
                Salvar permissões
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}

export function LinksPage() {
  const [showInviteModal, setShowInviteModal]   = useState(false)
  const [inviteResult, setInviteResult]         = useState<{ token: string; expiresAt: string } | null>(null)
  const [selectedLink, setSelectedLink]         = useState<LinkItem | null>(null)
  const [confirmRevokeId, setConfirmRevokeId]   = useState<string | null>(null)
  const qc = useQueryClient()
  const addToast = useUIStore((s) => s.addToast)

  const { data, isLoading } = useQuery({
    queryKey: ['links'],
    queryFn:  () => linksService.getLinks(),
  })

  const inviteMutation = useMutation({
    mutationFn: () => linksService.createInvite(),
    onSuccess: (result) => {
      setShowInviteModal(false)
      setInviteResult({ token: result.inviteToken, expiresAt: result.expiresAt })
      qc.invalidateQueries({ queryKey: ['links'] })
    },
    onError: () => addToast({ variant: 'error', message: 'Erro ao gerar convite' }),
  })

  const revokeMutation = useMutation({
    mutationFn: (id: string) => linksService.revoke(id),
    onSuccess: () => {
      addToast({ variant: 'success', message: 'Vínculo revogado' })
      setConfirmRevokeId(null)
      setSelectedLink(null)
      qc.invalidateQueries({ queryKey: ['links'] })
    },
    onError: () => addToast({ variant: 'error', message: 'Erro ao revogar vínculo' }),
  })

  const updatePermsMutation = useMutation({
    mutationFn: ({ id, permissions, currentPermissions }: { id: string; permissions: string[]; currentPermissions: string[] }) => {
      const grant  = permissions.filter((p) => !currentPermissions.includes(p)) as import('../services/links.service').LinkPermission[]
      const revoke = currentPermissions.filter((p) => !permissions.includes(p)) as import('../services/links.service').LinkPermission[]
      return linksService.updatePermissions(id, grant, revoke)
    },
    onSuccess: () => {
      addToast({ variant: 'success', message: 'Permissões atualizadas' })
      qc.invalidateQueries({ queryKey: ['links'] })
    },
    onError: () => addToast({ variant: 'error', message: 'Erro ao atualizar permissões' }),
  })

  const links  = data ?? []
  const active = links.filter((l) => l.status !== 'REVOKED')

  return (
    <div className="page-container space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-header text-xl flex items-center gap-2">
            <Users size={18} className="text-link" aria-hidden /> Vínculos
          </h1>
          <p className="text-sm text-slate-500 mt-1">Gerencie quem pode ver suas informações</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus size={14} />}
          onClick={() => setShowInviteModal(true)}
          className="bg-link hover:bg-link-dark"
        >
          Convidar Apoio
        </Button>
      </div>

      {/* Security notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-glass-border bg-glass">
        <Shield size={16} className="text-focus-light mt-0.5 flex-shrink-0" aria-hidden />
        <div>
          <p className="text-sm font-medium text-slate-300">Privacidade por padrão</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Apoio recém-convidado não vê nada até você conceder permissões. Cofre nunca é compartilhado.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <>
          <div>
            <h2 className="label-muted mb-3">
              {active.length} {active.length === 1 ? 'vínculo' : 'vínculos'} {active.length === 1 ? 'ativo' : 'ativos'}
            </h2>

            {links.length === 0 ? (
              <div className="glass-card p-12 text-center text-slate-500">
                <Users size={28} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhum vínculo ainda</p>
                <p className="text-xs mt-1">Convide alguém de confiança para acompanhar sua jornada</p>
              </div>
            ) : (
              <ul className="space-y-3" role="list">
                {links.map((link) => {
                  const status = statusConfig[link.status]
                  const StatusIcon = status.icon
                  return (
                    <li key={link.id}>
                      <Card className="p-4">
                        <div className="flex items-start gap-4">
                          <Avatar name={link.apoioName} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-slate-200">{link.apoioName}</span>
                              <Badge variant={status.variant}>
                                <StatusIcon size={11} aria-hidden />{status.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{link.apoioEmail}</p>

                            {link.permissions.length > 0 && (
                              <div className="flex gap-1.5 mt-2 flex-wrap" aria-label="Permissões concedidas">
                                {link.permissions.map((perm) => {
                                  const p = permissionConfig[perm]
                                  if (!p) return null
                                  const Icon = p.icon
                                  return (
                                    <Badge key={perm} variant={p.variant}>
                                      <Icon size={10} aria-hidden />{p.label}
                                    </Badge>
                                  )
                                })}
                              </div>
                            )}

                            {link.status === 'PENDING' && (
                              <p className="text-[10px] text-slate-600 mt-1.5">Aguardando aceitação do convite</p>
                            )}

                            {link.lastAccessAt && (
                              <p className="text-[10px] text-slate-600 mt-1.5 flex items-center gap-1">
                                <Clock size={9} aria-hidden />
                                Último acesso: {new Date(link.lastAccessAt).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLink(link)}
                            aria-label={`Gerenciar vínculo com ${link.apoioName}`}
                            className="text-slate-500 w-8 h-8 p-0 flex-shrink-0"
                          >
                            <Eye size={14} />
                          </Button>
                        </div>
                      </Card>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </>
      )}

      {/* Invite modal */}
      <Modal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Convidar pessoa de Apoio"
        description="Gere um token de convite e envie para o Apoio por outro canal"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Um token será gerado. Envie-o para a pessoa de Apoio por mensagem ou e-mail.
            Ela usará o token para aceitar o vínculo na conta dela.
          </p>
          <p className="text-xs text-slate-500">
            O Apoio precisará criar uma conta Neuro-Gen para aceitar. Você configura as permissões após o aceite.
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowInviteModal(false)}>Cancelar</Button>
            <Button
              variant="primary"
              className="bg-link hover:bg-link-dark"
              loading={inviteMutation.isPending}
              onClick={() => inviteMutation.mutate()}
            >
              Gerar convite
            </Button>
          </div>
        </div>
      </Modal>

      {/* Token display modal */}
      <Modal
        open={!!inviteResult}
        onClose={() => setInviteResult(null)}
        title="Token de convite gerado"
        description="Envie este token para a pessoa de Apoio"
      >
        <div className="space-y-4">
          <div className="bg-glass border border-link/30 rounded-xl p-4 font-mono text-sm text-link break-all text-center">
            {inviteResult?.token}
          </div>
          <p className="text-xs text-slate-500">
            Válido até: {inviteResult?.expiresAt ? new Date(inviteResult.expiresAt).toLocaleString('pt-BR') : '—'}
          </p>
          <Button
            variant="primary"
            fullWidth
            className="bg-link hover:bg-link-dark"
            onClick={() => { navigator.clipboard.writeText(inviteResult?.token ?? ''); addToast({ variant: 'success', message: 'Token copiado!' }); setInviteResult(null) }}
          >
            Copiar e fechar
          </Button>
        </div>
      </Modal>

      {/* Confirm revoke modal */}
      <Modal
        open={!!confirmRevokeId}
        onClose={() => setConfirmRevokeId(null)}
        title="Revogar vínculo"
        description="O Apoio perderá acesso imediatamente. Esta ação não pode ser desfeita."
      >
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setConfirmRevokeId(null)}>Cancelar</Button>
          <Button
            variant="danger"
            loading={revokeMutation.isPending}
            onClick={() => confirmRevokeId && revokeMutation.mutate(confirmRevokeId)}
          >
            Revogar
          </Button>
        </div>
      </Modal>

      {/* Detail/edit modal */}
      {selectedLink && (
        <LinkDetailModal
          link={selectedLink}
          onClose={() => setSelectedLink(null)}
          onRevoke={() => { setSelectedLink(null); setConfirmRevokeId(selectedLink.id) }}
          onUpdatePermissions={(perms) => updatePermsMutation.mutate({ id: selectedLink.id, permissions: perms, currentPermissions: selectedLink.permissions })}
        />
      )}
    </div>
  )
}
