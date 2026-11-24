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
  1:  { label: 'Muito baixo', color: '#ef4444' },
  2:  { label: 'Baixo',       color: '#f97316' },
  3:  { label: 'Neutro',      color: '#eab308' },
  4:  { label: 'Bem',         color: '#22c55e' },
  5:  { label: 'Ótimo',       color: '#10b981' },
  6:  { label: 'Muito bem',   color: '#10b981' },
  7:  { label: 'Excelente',   color: '#06b6d4' },
  8:  { label: 'Excelente',   color: '#6366f1' },
  9:  { label: 'Incrível',    color: '#7c3aed' },
  10: { label: 'Perfeito',    color: '#a855f7' },
}

export const energyConfig: Record<EnergyLevel, { label: string; color: string }> = {
  1:  { label: 'Exausto',          color: '#ef4444' },
  2:  { label: 'Cansado',          color: '#f97316' },
  3:  { label: 'Normal',           color: '#eab308' },
  4:  { label: 'Animado',          color: '#22c55e' },
  5:  { label: 'Cheio de energia', color: '#10b981' },
  6:  { label: 'Energizado',       color: '#10b981' },
  7:  { label: 'Muito energizado', color: '#06b6d4' },
  8:  { label: 'Ótima energia',    color: '#6366f1' },
  9:  { label: 'Pleno',            color: '#7c3aed' },
  10: { label: 'Máximo',           color: '#a855f7' },
}

// Keep for backwards compat (remove after migrating all consumers)
export const moodLabels = Object.fromEntries(
  Object.entries(moodConfig).map(([k, v]) => [k, { label: v.label, emoji: '' }]),
) as Record<MoodLevel, { label: string; emoji: string }>
