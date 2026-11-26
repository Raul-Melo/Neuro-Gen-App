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

  async register(data: RegisterRequest): Promise<{ id: string; email: string; role: string; status: string }> {
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

  /** Apenas em dev — retorna o token de verificação sem depender de e-mail.
   *  Em produção lança erro imediatamente sem fazer requisição. */
  async getDevVerificationToken(email: string): Promise<{ email: string; verificationToken: string; usage: string }> {
    if (!import.meta.env.DEV) throw new Error('Not available in production')
    const res = await api.get('/dev/verification-token', { params: { email } })
    return res.data
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

  /** Passo 1: gera segredo TOTP pendente (retorna 204). */
  async initTotp(): Promise<void> {
    await api.post('/users/me/totp')
  },

  /** Passo 2: retorna URI otpauth:// + segredo (one-time — chamar só uma vez por setup). */
  async getTotpSetup(): Promise<{ otpauthUri: string; secret: string }> {
    const res = await api.get('/users/me/totp/setup')
    return res.data
  },

  /** Passo 3: confirma o 2FA com o primeiro código gerado pelo autenticador. */
  async confirmTotp(code: string): Promise<void> {
    await api.post('/users/me/totp/confirm', { code })
  },

  async disableTotp(code: string): Promise<void> {
    await api.delete('/users/me/totp', { data: { code } })
  },
}
