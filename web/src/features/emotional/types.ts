import type { MoodLevel, EnergyLevel } from '@/shared/types/api.types'

export interface CheckIn {
  id: string
  moodLevel: MoodLevel
  energyLevel: EnergyLevel
  note?: string
  checkedAt: string
}

export interface JournalEntry {
  id: string
  content: string
  checkInId?: string
  createdAt: string
}

export interface EmotionalTrend {
  date: string
  avgMood: number
  avgEnergy: number
  checkInCount: number
}

export const moodConfig: Record<MoodLevel, { label: string; color: string }> = {
  1: { label: 'Muito baixo', color: '#ef4444' },
  2: { label: 'Baixo',       color: '#f97316' },
  3: { label: 'Neutro',      color: '#eab308' },
  4: { label: 'Bem',         color: '#22c55e' },
  5: { label: 'Ótimo',       color: '#10b981' },
}

export const energyConfig: Record<EnergyLevel, { label: string; color: string }> = {
  1: { label: 'Exausto',          color: '#ef4444' },
  2: { label: 'Cansado',          color: '#f97316' },
  3: { label: 'Normal',           color: '#eab308' },
  4: { label: 'Animado',          color: '#22c55e' },
  5: { label: 'Cheio de energia', color: '#10b981' },
}

export const moodLabels = Object.fromEntries(
  Object.entries(moodConfig).map(([k, v]) => [k, { label: v.label, emoji: '' }]),
) as Record<MoodLevel, { label: string; emoji: string }>
