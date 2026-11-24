import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import '@/styles/globals.css'
import { App } from '@/app/App'

// Registra o SW do PWA somente em produção (devOptions.enabled = false no vite.config)
if (import.meta.env.PROD) {
  registerSW({
    onNeedRefresh() {
      // Service worker novo disponível — a UI pode avisar o usuário
    },
    onOfflineReady() {
      console.info('[PWA] App pronto para uso offline')
    },
  })
}

async function bootstrap() {
  if (import.meta.env.VITE_MOCK === 'true') {
    // Remove service workers registrados em outros escopos (evita cache stale)
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(
        registrations
          .filter((r) => !r.active?.scriptURL.includes('mockServiceWorker'))
          .map((r) => r.unregister()),
      )
    }

    const { worker } = await import('./mocks/browser')
    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: {
        url: '/mockServiceWorker.js',
        options: { updateViaCache: 'none' }, // nunca usa cache do SW — sempre busca versão nova
      },
    })
    console.info('[MSW] Mock Service Worker ativo — backend não necessário')
  }

  const root = document.getElementById('root')
  if (!root) throw new Error('#root element not found')

  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

bootstrap()
