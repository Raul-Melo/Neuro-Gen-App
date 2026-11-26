import type { UserRole } from './api.types'

export interface User {
  id: string
  email: string
  role: UserRole
  status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED'
  emailVerified: boolean
  cpf?: string
  birthDate?: string
  hasPendingTotpSetup?: boolean
  totpEnabled: boolean
  createdAt?: string
  // name não existe no backend — derivado do e-mail para exibição
  name?: string
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
  cpf: string
  birthDate: string   // 'YYYY-MM-DD'
}

export interface RefreshRequest {
  refreshToken: string
}
