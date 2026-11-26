import api from '@/shared/lib/api'

// ── Tipos alinhados com o backend ────────────────────────────────────────────

export interface FocusSessionResult {
  id: string
  userId: string
  taskId?: string | null
  plannedMinutes: number
  breakMinutes: number
  status: 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'
  startedAt: string
  endedAt?: string | null
  effectiveSeconds: number
  pauses: { pausedAt: string; resumedAt?: string | null }[]
}

export interface StartSessionPayload {
  taskId?: string
  durationMinutes: number
  breakMinutes?: number
}

// ── Service ──────────────────────────────────────────────────────────────────

export const focusService = {
  /**
   * Inicia uma nova sessão de foco.
   * Regra: apenas uma sessão ativa por usuário por vez (backend retorna 409 se já houver).
   */
  async startSession(data: StartSessionPayload): Promise<FocusSessionResult> {
    const res = await api.post('/focus/sessions', data)
    return res.data
  },

  /**
   * Retorna a sessão em andamento.
   * Backend retorna 204 se não houver sessão ativa.
   */
  async getCurrentSession(): Promise<FocusSessionResult | null> {
    const res = await api.get('/focus/sessions/current')
    if (res.status === 204) return null
    return res.data
  },

  async pauseSession(id: string): Promise<FocusSessionResult> {
    const res = await api.post(`/focus/sessions/${id}/pause`)
    return res.data
  },

  async resumeSession(id: string): Promise<FocusSessionResult> {
    const res = await api.post(`/focus/sessions/${id}/resume`)
    return res.data
  },

  async completeSession(id: string): Promise<FocusSessionResult> {
    const res = await api.post(`/focus/sessions/${id}/complete`)
    return res.data
  },

  async cancelSession(id: string): Promise<FocusSessionResult> {
    const res = await api.post(`/focus/sessions/${id}/cancel`)
    return res.data
  },

  async deleteSession(id: string): Promise<void> {
    await api.delete(`/focus/sessions/${id}`)
  },

  /** Histórico de sessões no período (ISO 8601) */
  async getSessionHistory(params: { from: string; to: string }): Promise<FocusSessionResult[]> {
    const res = await api.get('/focus/sessions', { params })
    return Array.isArray(res.data) ? res.data : (res.data.content ?? [])
  },
}
