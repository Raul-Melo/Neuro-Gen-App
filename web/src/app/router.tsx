import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/shared/components/layout/AppShell'
import { PageSpinner } from '@/shared/components/ui'
import { useAuthStore } from '@/shared/stores/auth.store'

const lazy_ = <T extends React.ComponentType>(fn: () => Promise<{ [k: string]: T }>, key: string) =>
  lazy(() => fn().then((m) => ({ default: m[key] as T })))

// Auth
const LoginPage       = lazy_(() => import('@/features/auth/pages/LoginPage'),       'LoginPage')
const RegisterPage    = lazy_(() => import('@/features/auth/pages/RegisterPage'),    'RegisterPage')
const OnboardingPage  = lazy_(() => import('@/features/onboarding/pages/OnboardingPage'), 'OnboardingPage')

// App
const DashboardPage      = lazy_(() => import('@/features/dashboard/pages/DashboardPage'),       'DashboardPage')
const AgendaPage         = lazy_(() => import('@/features/agenda/pages/AgendaPage'),             'AgendaPage')
const FocusPage          = lazy_(() => import('@/features/focus/pages/FocusPage'),               'FocusPage')
const EmotionalPage      = lazy_(() => import('@/features/emotional/pages/EmotionalPage'),       'EmotionalPage')
const VaultPage          = lazy_(() => import('@/features/vault/pages/VaultPage'),               'VaultPage')
const LinksPage          = lazy_(() => import('@/features/links/pages/LinksPage'),               'LinksPage')
const NotificationsPage  = lazy_(() => import('@/features/notifications/pages/NotificationsPage'), 'NotificationsPage')
const SettingsPage       = lazy_(() => import('@/features/settings/pages/SettingsPage'),         'SettingsPage')

function S({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageSpinner />}>{children}</Suspense>
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequireTitular({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (user?.role !== 'TITULAR') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export const router = createBrowserRouter([
  // Public
  { path: '/login',    element: <S><LoginPage /></S> },
  { path: '/register', element: <S><RegisterPage /></S> },
  {
    path: '/onboarding',
    element: <RequireAuth><S><OnboardingPage /></S></RequireAuth>,
  },

  // Protected
  {
    element: <RequireAuth><AppShell /></RequireAuth>,
    children: [
      { path: '/dashboard',     element: <S><DashboardPage /></S> },
      { path: '/agenda',        element: <S><AgendaPage /></S> },
      { path: '/focus',         element: <S><FocusPage /></S> },
      { path: '/emotional',     element: <S><EmotionalPage /></S> },
      { path: '/vault',         element: <RequireTitular><S><VaultPage /></S></RequireTitular> },
      { path: '/links',         element: <S><LinksPage /></S> },
      { path: '/notifications', element: <S><NotificationsPage /></S> },
      { path: '/settings',      element: <S><SettingsPage /></S> },
    ],
  },

  { path: '/',  element: <RequireAuth><Navigate to="/dashboard" replace /></RequireAuth> },
  { path: '*',  element: <RequireAuth><Navigate to="/dashboard" replace /></RequireAuth> },
])
