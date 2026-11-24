import type { UserRole } from './api.types'

export interface User {
  id: string
  email: string
  name?: string        // não está no backend; mantido para compatibilidade com mock/UI
  role: UserRole
  status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED'
  emailVerified: boolean
  totpEnabled: boolean
  avatarUrl?: string
  createdAt?: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  tokenType?: string
  expiresIn: number
}

export interface LoginRequest {
  email: string
  password: string
  totpCode?: string
}

export interface RegisterRequest {
  email: string
  password: string
  role: UserRole
  // name não é aceito pelo backend — omitido aqui
}

export interface RefreshRequest {
  refreshToken: string
}
