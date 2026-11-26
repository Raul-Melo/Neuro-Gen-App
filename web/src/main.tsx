import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import '@/styles/globals.css'
import { App } from '@/app/App'

if (import.meta.env.PROD) {
  registerSW({
    onNeedRefresh() {},
    onOfflineReady() {
      console.info('[PWA] App pronto para uso offline')
    },
  })
}

const root = document.getElementById('root')
if (!root) throw new Error('#root element not found')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
