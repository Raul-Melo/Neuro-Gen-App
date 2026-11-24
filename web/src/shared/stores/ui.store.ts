import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ToastVariant = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  message: string
  variant: ToastVariant
  duration?: number
}

interface UIState {
  sidebarCollapsed: boolean
  mobileSidebarOpen: boolean
  reducedMotion: boolean
  reducedDensity: boolean
  fontScale: number

  toasts: Toast[]

  toggleSidebar: () => void
  setSidebarCollapsed: (v: boolean) => void
  setMobileSidebarOpen: (v: boolean) => void
  toggleReducedMotion: () => void
  toggleReducedDensity: () => void
  setReducedMotion: (v: boolean) => void
  setReducedDensity: (v: boolean) => void
  setFontScale: (scale: number) => void

  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      reducedMotion: false,
      reducedDensity: false,
      fontScale: 1,
      toasts: [],

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      setMobileSidebarOpen: (v) => set({ mobileSidebarOpen: v }),
      toggleReducedMotion:  () => set((s) => ({ reducedMotion: !s.reducedMotion })),
      toggleReducedDensity: () => set((s) => ({ reducedDensity: !s.reducedDensity })),
      setReducedMotion:  (v) => set({ reducedMotion: v }),
      setReducedDensity: (v) => set({ reducedDensity: v }),
      setFontScale: (scale) => set({ fontScale: scale }),

      addToast: (toast) =>
        set((s) => ({
          toasts: [
            ...s.toasts,
            { ...toast, id: `toast-${Date.now()}-${Math.random()}` },
          ],
        })),

      removeToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: 'ng-ui',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        reducedMotion: state.reducedMotion,
        reducedDensity: state.reducedDensity,
        fontScale: state.fontScale,
      }),
    },
  ),
)
