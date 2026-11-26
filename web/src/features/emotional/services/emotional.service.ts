import api from '@/shared/lib/api'

// ── Tipos alinhados com o backend ────────────────────────────────────────────

export interface CheckInResult {
  id: string
  moodScore: number       // 1–5
  energyLevel: number     // 1–5
  moodLevel: 'VERY_LOW' | 'LOW' | 'NEUTRAL' | 'HIGH' | 'VERY_HIGH'
  checkInDate: string     // 'YYYY-MM-DD'
  checkInTime: string     // 'HH:mm:ss'
  notes?: string | null
}

export interface JournalEntryResult {
  id: string
  content: string
  relatedCheckInId?: string | null
  entryDate: string
  createdAt: string
  updatedAt: string
}

export interface EmotionalTrendResult {
  dataPoints: CheckInResult[]
  averageMood: number
  averageEnergy: number
  periodDays: number
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING'
  disclaimer: string
}

// ── Service ──────────────────────────────────────────────────────────────────

export const emotionalService = {
  /** Registra check-in do dia atual (apenas um por dia). Backend escala 1–5. */
  async createCheckIn(data: {
    moodScore: number    // 1–5
    energyLevel: number  // 1–5
    notes?: string
  }): Promise<CheckInResult> {
    const res = await api.post('/emotional/checkins', data)
    return res.data
  },

  /** Lista check-ins dos últimos N dias (padrão 30). */
  async getCheckIns(params?: { periodDays?: number }): Promise<CheckInResult[]> {
    const res = await api.get('/emotional/checkins', { params })
    return Array.isArray(res.data) ? res.data : []
  },

  async getCheckIn(id: string): Promise<CheckInResult> {
    const res = await api.get(`/emotional/checkins/${id}`)
    return res.data
  },

  async deleteCheckIn(id: string): Promise<void> {
    await api.delete(`/emotional/checkins/${id}`)
  },

  /** Escreve entrada de diário (cifrada pelo servidor). */
  async createJournalEntry(data: {
    content: string
    relatedCheckInId?: string
  }): Promise<JournalEntryResult> {
    const res = await api.post('/emotional/journal', data)
    return res.data
  },

  async getJournal(): Promise<JournalEntryResult[]> {
    const res = await api.get('/emotional/journal')
    return Array.isArray(res.data) ? res.data : []
  },

  async getJournalEntry(id: string): Promise<JournalEntryResult> {
    const res = await api.get(`/emotional/journal/${id}`)
    return res.data
  },

  async updateJournalEntry(id: string, content: string): Promise<JournalEntryResult> {
    const res = await api.put(`/emotional/journal/${id}`, { content })
    return res.data
  },

  async deleteJournalEntry(id: string): Promise<void> {
    await api.delete(`/emotional/journal/${id}`)
  },

  /** Tendência emocional do período. */
  async getTrend(params?: {
    userId?: string
    periodDays?: number
  }): Promise<EmotionalTrendResult> {
    const res = await api.get('/emotional/trend', { params })
    return res.data
  },
}
