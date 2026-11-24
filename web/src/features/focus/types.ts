import type { FocusSessionStatus } from '@/shared/types/api.types'

export interface FocusSession {
  id: string
  taskId?: string
  taskTitle?: string
  workMinutes: number
  breakMinutes: number
  status: FocusSessionStatus
  elapsedSeconds: number
  completedCycles: number
  startedAt: string
  endedAt?: string
}

export interface FocusSettings {
  workMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  cyclesBeforeLongBreak: number
  autoStartBreaks: boolean
  autoStartWork: boolean
  silenceNotifications: boolean
}
