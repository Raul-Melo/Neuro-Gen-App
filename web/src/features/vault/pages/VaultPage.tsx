import { useState } from 'react'
import { Lock, Eye, EyeOff, Plus, Key, Globe, FileText, Shield, Search, Trash2, Copy, Check, X, AlertTriangle } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Card, Badge, Input, Spinner } from '@/shared/components/ui'
import { vaultService, type VaultEntry, type VaultEntryType } from '../services/vault.service'
import { encryptPayload, decryptPayload, deriveVerifier } from '../lib/crypto'
import { useUIStore } from '@/shared/stores/ui.store'
import { cn } from '@/shared/lib/cn'

const entryTypeConfig: Record<VaultEntryType, { icon: React.ElementType; label: string; color: string }> = {
  CREDENTIAL: { icon: Globe,     label: 'Credencial', color: '#d97706' },
  NOTE:       { icon: FileText,  label: 'Nota',       color: '#06b6d4' },
  DOCUMENT:   { icon: FileText,  label: 'Documento',  color: '#8b5cf6' },
  HEALTH:     { icon: Shield,    label: 'Saúde',      color: '#10b981' },
  OTHER:      { icon: Key,       label: 'Outro',      color: '#94a3b8' },
}

// ── Decrypt & display detail ─────────────────────────────────────────────────

function EntryDetail({
  entry,
  masterPassword,
  onClose,
}: { entry: VaultEntry & { encryptedPayload?: string }; masterPassword: string; onClose: () => void }) {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [fields, setFields]           = useState<Record<string, string> | null>(null)
  const [decryptErr, setDecryptErr]   = useState('')
  const cfg = entryTypeConfig[entry.entryType] ?? entryTypeConfig.OTHER
  const Icon = cfg.icon

  const decrypt = async () => {
    if (!entry.encryptedPayload) { setDecryptErr('Sem payload para descriptografar'); return }
    try {
      const plaintext = await decryptPayload(entry.encryptedPayload, masterPassword)
      setFields(JSON.parse(plaintext))
    } catch {
      setDecryptErr('Falha ao descriptografar — senha mestra incorreta?')
    }
  }

  const copyField = async (key: string, value: string) => {
    await navigator.clipboard.writeText(value)
    setCopiedField(key)
    setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={entry.label}>
      <div className="w-full max-w-sm glass-card p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${cfg.color}15` }}>
              <Icon size={18} style={{ color: cfg.color }} aria-hidden />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">{entry.label}</p>
              <p className="text-xs text-slate-500">{cfg.label}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="text-slate-500 hover:text-slate-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
            <EyeOff size={16} />
          </button>
        </div>

        {fields ? (
          <div className="space-y-3">
            {Object.entries(fields).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2 p-3 rounded-xl bg-glass border border-glass-border">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">{key}</p>
                  <p className="text-sm text-slate-200 font-mono truncate">
                    {key.toLowerCase().includes('senha') || key.toLowerCase().includes('password')
                      ? '••••••••'
                      : value}
                  </p>
                </div>
                <button
                  onClick={() => copyField(key, value)}
                  aria-label={`Copiar ${key}`}
                  className="text-slate-500 hover:text-slate-200 transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  {copiedField === key ? <Check size={14} className="text-emotional" /> : <Copy size={14} />}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center space-y-3">
            {decryptErr ? (
              <p className="text-xs text-danger flex items-center justify-center gap-1"><AlertTriangle size={12} />{decryptErr}</p>
            ) : (
              <p className="text-xs text-slate-500">Clique para descriptografar localmente</p>
            )}
            <Button variant="primary" size="sm" onClick={decrypt} className="bg-vault hover:bg-vault-dark">
              <Eye size={14} /> Ver dados
            </Button>
          </div>
        )}

        <p className="text-[10px] text-slate-600 italic mt-4 text-center">
          Dados descriptografados apenas nesta sessão
        </p>
      </div>
    </div>
  )
}

// ── Create entry modal ───────────────────────────────────────────────────────

function CreateEntryModal({
  vaultSessionToken,
  masterPassword,
  onClose,
  onCreated,
}: {
  vaultSessionToken: string
  masterPassword: string
  onClose: () => void
  onCreated: () => void
}) {
  const [label, setLabel]       = useState('')
  const [entryType, setEntryType] = useState<VaultEntryType>('CREDENTIAL')
  const [fields, setFields]     = useState([{ key: '', value: '' }])
  const [saving, setSaving]     = useState(false)
  const [err, setErr]           = useState('')
  const addToast = useUIStore((s) => s.addToast)

  const addField  = () => setFields((f) => [...f, { key: '', value: '' }])
  const removeField = (i: number) => setFields((f) => f.filter((_, idx) => idx !== i))
  const updateField = (i: number, k: 'key' | 'value', v: string) =>
    setFields((f) => f.map((x, idx) => idx === i ? { ...x, [k]: v } : x))

  const save = async () => {
    if (!label.trim()) { setErr('Informe o nome da entrada'); return }
    const filled = fields.filter((f) => f.key.trim())
    if (filled.length === 0) { setErr('Adicione pelo menos um campo'); return }
    setSaving(true); setErr('')
    try {
      const payload: Record<string, string> = {}
      filled.forEach((f) => { payload[f.key.trim()] = f.value })
      const encryptedPayload = await encryptPayload(JSON.stringify(payload), masterPassword)
      await vaultService.createEntry(vaultSessionToken, { label: label.trim(), encryptedPayload, entryType })
      addToast({ variant: 'success', message: 'Entrada criada no cofre!' })
      onCreated()
      onClose()
    } catch {
      setErr('Erro ao criar entrada. Verifique sua sessão do cofre.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Nova entrada no cofre">
      <div className="w-full max-w-sm glass-card p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-slate-100 font-display">Nova entrada</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-slate-500 hover:text-slate-200 min-w-[44px] min-h-[44px] flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label-muted block mb-1" htmlFor="entry-label">Nome da entrada *</label>
            <input
              id="entry-label"
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: Banco do Brasil, Gmail..."
              className="w-full h-10 rounded-xl bg-glass border border-glass-border px-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-vault/50 transition-all"
            />
          </div>

          <div>
            <label className="label-muted block mb-1" htmlFor="entry-type">Tipo</label>
            <select
              id="entry-type"
              value={entryType}
              onChange={(e) => setEntryType(e.target.value as VaultEntryType)}
              className="w-full h-10 rounded-xl bg-glass border border-glass-border px-3 text-sm text-slate-200 focus:outline-none focus:border-vault/50 transition-all"
            >
              {Object.entries(entryTypeConfig).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label-muted">Campos *</label>
              <button onClick={addField} className="text-xs text-vault hover:text-vault-dark transition-colors flex items-center gap-1 min-h-[44px]">
                <Plus size={12} /> Campo
              </button>
            </div>
            <div className="space-y-2">
              {fields.map((f, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={f.key}
                    onChange={(e) => updateField(i, 'key', e.target.value)}
                    placeholder="Campo (ex: Usuário)"
                    className="w-2/5 h-9 rounded-lg bg-glass border border-glass-border px-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-vault/50"
                  />
                  <input
                    value={f.value}
                    onChange={(e) => updateField(i, 'value', e.target.value)}
                    placeholder="Valor"
                    type={f.key.toLowerCase().includes('senha') || f.key.toLowerCase().includes('password') ? 'password' : 'text'}
                    className="flex-1 h-9 rounded-lg bg-glass border border-glass-border px-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-vault/50"
                  />
                  {fields.length > 1 && (
                    <button onClick={() => removeField(i)} aria-label="Remover campo" className="text-slate-600 hover:text-danger transition-colors min-w-[36px] flex items-center justify-center">
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {err && <p className="text-xs text-danger flex items-center gap-1"><AlertTriangle size={12} />{err}</p>}

          <div className="flex gap-2">
            <Button variant="ghost" fullWidth onClick={onClose}>Cancelar</Button>
            <Button variant="primary" fullWidth loading={saving} onClick={save} className="bg-vault hover:bg-vault-dark">
              Salvar
            </Button>
          </div>

          <p className="text-[10px] text-slate-600 italic text-center">
            Dados cifrados localmente com AES-256-GCM antes de enviar
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Setup modal (primeira vez) ───────────────────────────────────────────────

function VaultSetupModal({ onClose, onSetup }: { onClose: () => void; onSetup: (recoveryKey: string) => void }) {
  const [masterPassword, setMasterPassword] = useState('')
  const [confirm, setConfirm]               = useState('')
  const [showPw, setShowPw]                 = useState(false)
  const [saving, setSaving]                 = useState(false)
  const [err, setErr]                       = useState('')
  const addToast = useUIStore((s) => s.addToast)

  const setup = async () => {
    if (masterPassword.length < 8) { setErr('Senha mestra precisa ter pelo menos 8 caracteres'); return }
    if (masterPassword !== confirm) { setErr('As senhas não coincidem'); return }
    setSaving(true); setErr('')
    try {
      // Gera e persiste o salt para que o unlock possa reproduzir o mesmo hash
      const salt = crypto.getRandomValues(new Uint8Array(16))
      localStorage.setItem('ng_vault_salt', btoa(String.fromCharCode(...salt)))
      const masterPasswordHash = await deriveVerifier(masterPassword, salt)
      const result = await vaultService.setup({ argon2Params: 'm=65536,t=3,p=4', masterPasswordHash })
      addToast({ variant: 'success', message: 'Cofre configurado!' })
      onSetup(result.recoveryKey)
    } catch {
      setErr('Erro ao configurar cofre. Verifique se já foi configurado anteriormente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm glass-card p-6 animate-slide-up">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-vault-muted flex items-center justify-center">
            <Shield size={18} className="text-vault" aria-hidden />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100 font-display">Configurar Cofre</h2>
            <p className="text-xs text-slate-500">Primeira vez — crie sua senha mestra</p>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            label="Senha mestra"
            type={showPw ? 'text' : 'password'}
            value={masterPassword}
            onChange={(e) => setMasterPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            rightElement={
              <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? 'Ocultar' : 'Mostrar'} className="text-slate-500 hover:text-slate-300 transition-colors">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }
          />
          <Input
            label="Confirmar senha mestra"
            type={showPw ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setup()}
            placeholder="Repita a senha"
          />

          <p className="text-xs text-amber-500/80 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
            ⚠️ Anote a chave de recuperação que será exibida. Sem ela, não é possível recuperar seus dados se esquecer a senha.
          </p>

          {err && <p className="text-xs text-danger">{err}</p>}

          <div className="flex gap-2">
            <Button variant="ghost" fullWidth onClick={onClose}>Cancelar</Button>
            <Button variant="primary" fullWidth loading={saving} onClick={setup} className="bg-vault hover:bg-vault-dark">
              Configurar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export function VaultPage() {
  const [vaultSessionToken, setVaultSessionToken] = useState<string | null>(null)
  const [masterPassword, setMasterPassword]       = useState('')
  const [showPassword, setShowPassword]           = useState(false)
  const [unlocking, setUnlocking]                 = useState(false)
  const [error, setError]                         = useState('')
  const [search, setSearch]                       = useState('')
  const [selectedEntry, setSelectedEntry]         = useState<(VaultEntry & { encryptedPayload?: string }) | null>(null)
  const [showCreate, setShowCreate]               = useState(false)
  const [showSetup, setShowSetup]                 = useState(false)
  const [recoveryKey, setRecoveryKey]             = useState<string | null>(null)
  const qc = useQueryClient()
  const addToast = useUIStore((s) => s.addToast)

  const unlocked = !!vaultSessionToken

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['vault-entries'],
    queryFn:  () => vaultService.getEntries(vaultSessionToken!),
    enabled:  unlocked,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vaultService.deleteEntry(vaultSessionToken!, id),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['vault-entries'] })
      addToast({ variant: 'success', message: 'Entrada excluída' })
    },
  })

  const handleUnlock = async () => {
    if (!masterPassword) { setError('Insira a senha mestra'); return }
    setUnlocking(true); setError('')
    try {
      // Recupera o salt armazenado no setup para reproduzir o mesmo hash
      const storedSalt = localStorage.getItem('ng_vault_salt')
      if (!storedSalt) {
        setError('Cofre não configurado neste dispositivo. Configure primeiro.')
        setShowSetup(true)
        return
      }
      const salt = Uint8Array.from(atob(storedSalt), (c) => c.charCodeAt(0))
      const masterPasswordHash = await deriveVerifier(masterPassword, salt)
      const result = await vaultService.open(masterPasswordHash)
      setVaultSessionToken(result.vaultSessionToken)
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status
      if (status === 422) {
        setError('Cofre não configurado. Configure primeiro.')
        setShowSetup(true)
      } else if (status === 403) {
        setError('Senha mestra incorreta.')
      } else {
        setError('Erro ao desbloquear cofre. Tente novamente.')
      }
    } finally {
      setUnlocking(false)
    }
  }

  const handleLock = async () => {
    if (vaultSessionToken) {
      try { await vaultService.lock(vaultSessionToken) } catch { /* já expirou */ }
    }
    setVaultSessionToken(null)
    setMasterPassword('')
    qc.removeQueries({ queryKey: ['vault-entries'] })
  }

  // ── Locked view ─────────────────────────────────────────────────────────────
  if (!unlocked) {
    return (
      <div className="page-container animate-fade-in">
        <div className="max-w-sm mx-auto">
          <Card className="p-8 text-center" accentColor="#d97706">
            <div className="w-16 h-16 rounded-2xl bg-vault-muted border border-vault/20 flex items-center justify-center mx-auto mb-5">
              <Lock size={28} className="text-vault" aria-hidden />
            </div>
            <h1 className="font-display font-semibold text-slate-100 text-xl mb-1">Cofre de Senhas</h1>
            <p className="text-sm text-slate-500 mb-6">
              Protegido por criptografia zero-knowledge. Apenas você tem acesso.
            </p>
            <div className="text-left space-y-4">
              <Input
                label="Senha mestra"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                error={error}
                leftIcon={<Key size={15} />}
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
                autoComplete="current-password"
              />
              <Button
                variant="primary"
                fullWidth
                size="lg"
                loading={unlocking}
                onClick={handleUnlock}
                className="bg-vault hover:bg-vault-dark"
              >
                <Lock size={16} /> Desbloquear
              </Button>
              <Button
                variant="ghost"
                fullWidth
                size="sm"
                onClick={() => setShowSetup(true)}
                className="text-slate-500 text-xs"
              >
                Configurar cofre pela primeira vez
              </Button>
            </div>
            <p className="text-xs text-slate-600 mt-5 italic">
              Chave derivada localmente. Nunca enviada ao servidor.
            </p>
          </Card>

          <div className="flex items-center justify-center gap-2 mt-4">
            <Shield size={12} className="text-slate-600" aria-hidden />
            <p className="text-xs text-slate-600">AES-256-GCM · PBKDF2 · Zero-knowledge</p>
          </div>
        </div>

        {showSetup && (
          <VaultSetupModal
            onClose={() => setShowSetup(false)}
            onSetup={(key) => { setShowSetup(false); setRecoveryKey(key) }}
          />
        )}

        {recoveryKey && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-sm glass-card p-6 animate-slide-up">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={18} className="text-amber-400" />
                <h2 className="font-semibold text-slate-100">Guarde sua chave de recuperação</h2>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Esta chave é exibida uma única vez. Sem ela, você não consegue recuperar os dados se esquecer a senha mestra.
              </p>
              <div className="bg-glass border border-vault/30 rounded-xl p-4 font-mono text-sm text-vault text-center tracking-widest mb-4">
                {recoveryKey}
              </div>
              <Button
                variant="primary"
                fullWidth
                onClick={() => { navigator.clipboard.writeText(recoveryKey); setRecoveryKey(null) }}
                className="bg-vault hover:bg-vault-dark"
              >
                <Copy size={14} /> Copiei — Fechar
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Unlocked view ───────────────────────────────────────────────────────────
  const filtered = entries.filter((e) =>
    !search || e.label.toLowerCase().includes(search.toLowerCase()),
  )

  const grouped: Record<string, VaultEntry[]> = {}
  filtered.forEach((e) => {
    const type = e.entryType ?? 'OTHER'
    if (!grouped[type]) grouped[type] = []
    grouped[type].push(e)
  })

  return (
    <div className="page-container space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="section-header text-xl">Cofre</h1>
            <Badge variant="vault" dot>Desbloqueado</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">{entries.length} entradas</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLock}
            aria-label="Bloquear cofre"
            className="text-slate-500"
          >
            <Lock size={15} />
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={() => setShowCreate(true)}
            className="bg-vault hover:bg-vault-dark"
          >
            Nova entrada
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar entradas..."
          aria-label="Buscar entradas do cofre"
          className="w-full h-10 pl-9 pr-4 rounded-xl bg-glass border border-glass-border text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-vault/50 transition-all"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-500">
          <Key size={28} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">{search ? 'Nenhuma entrada encontrada' : 'Nenhuma senha salva'}</p>
          {!search && (
            <Button variant="ghost" size="sm" className="mt-3 text-vault" onClick={() => setShowCreate(true)}>
              <Plus size={12} /> Criar primeira entrada
            </Button>
          )}
        </div>
      ) : (
        Object.entries(grouped).map(([type, items]) => {
          const cfg = entryTypeConfig[type as VaultEntryType] ?? entryTypeConfig.OTHER
          const Icon = cfg.icon
          return (
            <div key={type}>
              <h2 className="label-muted mb-2 flex items-center gap-1.5">
                <Icon size={12} style={{ color: cfg.color }} aria-hidden />
                {cfg.label} ({items.length})
              </h2>
              <ul className="space-y-2" role="list">
                {items.map((entry) => (
                  <li key={entry.id}>
                    <div className="glass-card-hover p-4 flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${cfg.color}15` }}
                      >
                        <Icon size={18} style={{ color: cfg.color }} aria-hidden />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200">{entry.label}</p>
                        <p className="text-xs text-slate-500 truncate">{cfg.label}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedEntry(entry as VaultEntry & { encryptedPayload?: string })}
                          aria-label={`Ver detalhes de ${entry.label}`}
                          className={cn('text-slate-500 hover:text-slate-200 w-8 h-8 p-0')}
                        >
                          <Eye size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(entry.id)}
                          aria-label={`Excluir ${entry.label}`}
                          className="text-slate-700 hover:text-danger w-8 h-8 p-0"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )
        })
      )}

      {/* Security footer */}
      <div className="flex items-center justify-center gap-2 pt-2">
        <Shield size={11} className="text-slate-700" aria-hidden />
        <p className="text-xs text-slate-700">AES-256-GCM · PBKDF2 · Zero-knowledge</p>
      </div>

      {selectedEntry && (
        <EntryDetail
          entry={selectedEntry}
          masterPassword={masterPassword}
          onClose={() => setSelectedEntry(null)}
        />
      )}

      {showCreate && (
        <CreateEntryModal
          vaultSessionToken={vaultSessionToken}
          masterPassword={masterPassword}
          onClose={() => setShowCreate(false)}
          onCreated={() => qc.invalidateQueries({ queryKey: ['vault-entries'] })}
        />
      )}
    </div>
  )
}
