import api from '@/shared/lib/api'

// ── Tipos alinhados com o backend ────────────────────────────────────────────

export type VaultEntryType = 'CREDENTIAL' | 'NOTE' | 'DOCUMENT' | 'HEALTH' | 'OTHER'

export interface VaultEntry {
  id: string
  label: string
  entryType: VaultEntryType
  createdAt: string
  updatedAt?: string
}

export interface VaultSetupResult {
  recoveryKey: string
  configuredAt: string
}

export interface VaultOpenResult {
  vaultSessionToken: string
  expiresAt: string
}

// ── Helpers para o header de sessão do Vault ─────────────────────────────────

function vaultHeaders(vaultSessionToken: string) {
  return { 'X-Vault-Session': vaultSessionToken }
}

// ── Service ──────────────────────────────────────────────────────────────────

export const vaultService = {
  /**
   * Configura o Cofre pela primeira vez.
   * O hash da senha mestra DEVE ser derivado localmente via Argon2id — nunca enviar a senha em texto.
   */
  async setup(data: {
    argon2Params: string
    masterPasswordHash: string
  }): Promise<VaultSetupResult> {
    const res = await api.post('/vault/setup', data)
    return res.data
  },

  /**
   * Abre o Cofre. Retorna o vaultSessionToken (válido por 5 min de inatividade).
   */
  async open(masterPasswordHash: string): Promise<VaultOpenResult> {
    const res = await api.post('/vault/open', { masterPasswordHash })
    return res.data
  },

  /**
   * Bloqueia o Cofre (invalida a sessão imediatamente).
   */
  async lock(vaultSessionToken: string): Promise<void> {
    await api.post('/vault/lock', null, { headers: vaultHeaders(vaultSessionToken) })
  },

  /**
   * Redefine a senha mestra usando a chave de recuperação.
   */
  async recover(data: {
    recoveryKey: string
    newMasterPasswordHash: string
  }): Promise<void> {
    await api.post('/vault/recover', data)
  },

  /**
   * Lista entradas (apenas metadados — ciphertext nunca retornado na listagem).
   */
  async getEntries(vaultSessionToken: string): Promise<VaultEntry[]> {
    const res = await api.get('/vault/entries', { headers: vaultHeaders(vaultSessionToken) })
    return Array.isArray(res.data) ? res.data : (res.data.content ?? [])
  },

  /**
   * Cria uma entrada cifrada. O encryptedPayload deve ser cifrado localmente.
   */
  async createEntry(
    vaultSessionToken: string,
    data: { label: string; encryptedPayload: string; entryType: VaultEntryType },
  ): Promise<VaultEntry> {
    const res = await api.post('/vault/entries', data, { headers: vaultHeaders(vaultSessionToken) })
    return res.data
  },

  /**
   * Atualiza label e/ou ciphertext de uma entrada.
   */
  async updateEntry(
    vaultSessionToken: string,
    id: string,
    data: { label?: string; encryptedPayload?: string },
  ): Promise<VaultEntry> {
    const res = await api.put(`/vault/entries/${id}`, data, { headers: vaultHeaders(vaultSessionToken) })
    return res.data
  },

  async deleteEntry(vaultSessionToken: string, id: string): Promise<void> {
    await api.delete(`/vault/entries/${id}`, { headers: vaultHeaders(vaultSessionToken) })
  },
}
