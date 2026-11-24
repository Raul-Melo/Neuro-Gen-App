import api from '@/shared/lib/api'

// ── Tipos alinhados com o backend ────────────────────────────────────────────

export interface CheckInResult {
  id: string
  moodScore: number       // 1–10
  energyLevel: number     // 1–10
  checkInDate: string     // 'YYYY-MM-DD'
  checkInTime: string     // 'HH:mm:ss'
  createdAt: string
}

export interface JournalResult {
  message: string         // 'Entrada registrada: <id>'
}

export interface EmotionalTrendResult {
  ownerId: string
  periodDays: number
  totalCheckIns: number
  avgMoodScore: number
  avgEnergyLevel: number
  moodTrend: 'IMPROVING' | 'STABLE' | 'DECLINING' | 'INSUFFICIENT_DATA'
  energyTrend: 'IMPROVING' | 'STABLE' | 'DECLINING' | 'INSUFFICIENT_DATA'
  disclaimer: string
}

// ── Service ──────────────────────────────────────────────────────────────────

export const emotionalService = {
  /**
   * Registra check-in do dia atual (apenas um por dia por usuário).
   * Backend espera moodScore 1-10; a UI usa escala 1-5 — multiplica por 2.
   */
  async createCheckIn(data: {
    moodScore: number   // 1-5 (UI) → enviado como 1-10
    energyLevel: number // 1-5 (UI) → enviado como 1-10
    notes?: string
  }): Promise<CheckInResult> {
    const res = await api.post('/emotional/checkins', {
      moodScore:   data.moodScore * 2,
      energyLevel: data.energyLevel * 2,
      notes:       data.notes,
    })
    return res.data
  },

  /**
   * Lista check-ins recentes do usuário.
   * Backend: GET /emotional/checkins
   */
  async getCheckIns(params?: { page?: number; size?: number }): Promise<{ content: CheckInResult[] }> {
    const res = await api.get('/emotional/checkins', { params })
    const data = res.data
    return Array.isArray(data) ? { content: data } : data
  },

  /**
   * Escreve entrada de diário emocional (cifrada pelo servidor).
   * Backend: POST /emotional/journal
   */
  async createJournalEntry(data: {
    content: string
    relatedCheckInId?: string
  }): Promise<JournalResult> {
    const res = await api.post('/emotional/journal', data)
    return res.data
  },

  /**
   * Retorna tendência de humor/energia no período.
   * Backend: GET /emotional/trend
   * - userId: UUID do Titular a consultar (Apoio com permissão EMOTIONAL_CHECKIN)
   * - periodDays: janela em dias (padrão 30)
   */
  async getTrend(params?: {
    userId?: string
    periodDays?: number
  }): Promise<EmotionalTrendResult> {
    const res = await api.get('/emotional/trend', { params })
    return res.data
  },
}
