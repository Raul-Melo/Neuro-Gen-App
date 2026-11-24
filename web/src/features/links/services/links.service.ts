import api from '@/shared/lib/api'

// ── Tipos alinhados com o backend ────────────────────────────────────────────

export type LinkPermission = 'AGENDA' | 'TASKS' | 'FOCUS' | 'EMOTIONAL_CHECKIN' | 'VAULT'

export interface LinkResponse {
  id: string
  titularId: string
  apoioId: string
  status: 'ACTIVE' | 'PENDING' | 'REVOKED'
  permissions: LinkPermission[]
  createdAt: string
  // Campos extras populados pelo mock (não existem no backend real)
  apoioName?: string
  apoioEmail?: string
  lastAccessAt?: string | null
}

export interface InviteResult {
  inviteToken: string
  expiresAt: string
}

// ── Service ──────────────────────────────────────────────────────────────────

export const linksService = {
  /** Lista vínculos do usuário autenticado (Titular vê seus Apoios; Apoio vê seus Titulares) */
  async getLinks(): Promise<LinkResponse[]> {
    const res = await api.get('/links')
    return Array.isArray(res.data) ? res.data : (res.data.content ?? [])
  },

  /**
   * Titular cria um convite. Retorna o token que deve ser enviado ao Apoio.
   * Backend: POST /links (sem body)
   */
  async createInvite(): Promise<InviteResult> {
    const res = await api.post('/links')
    return res.data
  },

  /**
   * Apoio aceita o convite com o token recebido.
   * Backend: POST /links/accept
   */
  async acceptInvite(inviteToken: string): Promise<LinkResponse> {
    const res = await api.post('/links/accept', { inviteToken })
    return res.data
  },

  /**
   * Titular atualiza permissões do vínculo (grant/revoke granular).
   * Backend: PATCH /links/:linkId/permissions
   */
  async updatePermissions(
    linkId: string,
    grant: LinkPermission[],
    revoke: LinkPermission[],
  ): Promise<LinkResponse> {
    const res = await api.patch(`/links/${linkId}/permissions`, { grant, revoke })
    return res.data
  },

  /**
   * Titular revoga o vínculo imediatamente (invalida sessões do Apoio).
   * Backend: DELETE /links/:linkId
   */
  async revoke(linkId: string): Promise<void> {
    await api.delete(`/links/${linkId}`)
  },
}
