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

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type LinkStatus = 'PENDING' | 'ACTIVE' | 'REVOKED' | 'EXPIRED'

// Backend values: RUNNING | PAUSED | COMPLETED | CANCELLED
export type FocusSessionStatus = 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'

// Backend scale: 1–5
export type MoodLevel = 1 | 2 | 3 | 4 | 5
export type EnergyLevel = 1 | 2 | 3 | 4 | 5
