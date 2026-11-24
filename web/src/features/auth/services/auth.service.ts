import api from '@/shared/lib/api'
import type { LoginRequest, RegisterRequest, AuthTokens, User } from '@/shared/types/auth.types'

export const authService = {
  /**
   * Login: backend retorna apenas tokens.
   * Chame authService.me() em seguida para obter o perfil do usuário.
   */
  async login(data: LoginRequest): Promise<AuthTokens> {
    const res = await api.post('/auth/login', data)
    // Backend retorna { accessToken, refreshToken, tokenType, expiresIn }
    return res.data as AuthTokens
  },

  async register(data: RegisterRequest): Promise<{ message: string }> {
    const res = await api.post('/auth/register', data)
    return res.data
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const res = await api.post('/auth/refresh', { refreshToken })
    return res.data
  },

  async logout(refreshToken: string): Promise<void> {
    await api.post('/auth/logout', { refreshToken })
  },

  async me(): Promise<User> {
    const res = await api.get('/users/me')
    return res.data
  },

  async verifyEmail(token: string): Promise<void> {
    await api.post('/auth/verify-email', { token })
  },

  /** Solicita reset de senha — sempre retorna 202 (não confirma existência do e-mail) */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const res = await api.post('/auth/password-reset/request', { email })
    return res.data
  },

  /** Confirma reset com o token recebido por e-mail */
  async confirmPasswordReset(resetToken: string, newPassword: string): Promise<void> {
    await api.post('/auth/password-reset/confirm', { resetToken, newPassword })
  },

  /** Setup TOTP — retorna a URI otpauth:// para o QR code */
  async setupTotp(): Promise<{ otpauthUri: string; secret: string }> {
    const res = await api.post('/users/me/totp/setup')
    return res.data
  },

  async confirmTotp(code: string): Promise<void> {
    await api.post('/users/me/totp/confirm', { code })
  },

  async disableTotp(code: string): Promise<void> {
    await api.delete('/users/me/totp', { data: { code } })
  },
}
