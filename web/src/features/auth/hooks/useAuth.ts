import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/auth.service'
import { useAuthStore } from '@/shared/stores/auth.store'
import { useUIStore } from '@/shared/stores/ui.store'
import type { LoginRequest, RegisterRequest } from '@/shared/types/auth.types'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/shared/types/api.types'

interface BackendError extends ApiError {
  fieldErrors?: Record<string, string>
}

function extractMessage(error: unknown): string {
  const axiosError = error as AxiosError<BackendError>
  const data = axiosError.response?.data
  if (data?.fieldErrors) {
    const fields = Object.entries(data.fieldErrors)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' · ')
    return fields
  }
  return data?.message ?? 'Ocorreu um erro. Tente novamente.'
}

export function useLogin() {
  const { setAuth } = useAuthStore()
  const { addToast } = useUIStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      // Backend retorna só tokens; busca o perfil em seguida
      const tokens = await authService.login(data)

      // Armazena tokens antes de chamar /users/me (interceptor precisa deles)
      localStorage.setItem('ng_access_token', tokens.accessToken)
      localStorage.setItem('ng_refresh_token', tokens.refreshToken)

      const user = await authService.me()
      return { tokens, user }
    },
    onSuccess: ({ tokens, user }) => {
      setAuth(user, tokens.accessToken, tokens.refreshToken)
      navigate('/dashboard')
    },
    onError: (error) => {
      localStorage.removeItem('ng_access_token')
      localStorage.removeItem('ng_refresh_token')
      addToast({ variant: 'error', message: extractMessage(error) })
    },
  })
}

export function useRegister() {
  const { addToast } = useUIStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: RegisterRequest) => authService.register(data),
    onSuccess: (_, variables) => {
      addToast({
        variant: 'success',
        message: 'Conta criada! Verifique seu e-mail para ativar.',
        duration: 6000,
      })
      navigate(`/verify-email?email=${encodeURIComponent(variables.email)}`)
    },
    onError: (error) => {
      addToast({ variant: 'error', message: extractMessage(error) })
    },
  })
}

export function useLogout() {
  const { logout, refreshToken } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: () =>
      refreshToken ? authService.logout(refreshToken) : Promise.resolve(),
    onSettled: () => {
      logout()
      navigate('/login')
    },
  })
}
