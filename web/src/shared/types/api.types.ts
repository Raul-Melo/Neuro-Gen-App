export interface ApiError {
  code: string
  message: string
  details?: Record<string, string[]>
}

export interface ApiResponse<T> {
  data: T
}

export interface PaginatedResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export type UserRole = 'TITULAR' | 'APOIO'

// Backend values: PENDING | IN_PROGRESS | DONE | CANCELLED
// Legacy mock values: TODO | ARCHIVED — mantidos para compatibilidade com MSW
export type TaskStatus = 'PENDING' | 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED' | 'ARCHIVED'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type LinkStatus = 'PENDING' | 'ACTIVE' | 'REVOKED'

// Backend values: RUNNING | PAUSED | COMPLETED | CANCELLED
// Legacy mock values: DONE | ABANDONED — mantidos para compatibilidade com MSW
export type FocusSessionStatus = 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'DONE' | 'CANCELLED' | 'ABANDONED'

// 1–10 (backend), 1–5 (mock legacy)
export type MoodLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
export type EnergyLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
