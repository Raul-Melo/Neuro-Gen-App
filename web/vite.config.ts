import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.png', 'apple-touch-icon.png', 'logo-192.webp'],
      manifest: {
        name: 'Neuro-Gen',
        short_name: 'Neuro-Gen',
        description: 'Agenda adaptativa para neurodivergentes — foco, emoção e organização.',
        theme_color: '#06080f',
        background_color: '#06080f',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/dashboard',
        lang: 'pt-BR',
        categories: ['productivity', 'health', 'lifestyle'],
        icons: [
          {
            src: '/logo-64.webp',
            sizes: '64x64',
            type: 'image/webp',
          },
          {
            src: '/logo-192.webp',
            sizes: '192x192',
            type: 'image/webp',
          },
          {
            src: '/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'apple touch icon',
          },
          {
            src: '/favicon.png',
            sizes: '32x32',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Agenda',
            short_name: 'Agenda',
            url: '/agenda',
            icons: [{ src: '/logo-64.webp', sizes: '64x64', type: 'image/webp' }],
          },
          {
            name: 'Foco',
            short_name: 'Foco',
            url: '/focus',
            icons: [{ src: '/logo-64.webp', sizes: '64x64', type: 'image/webp' }],
          },
        ],
      },
      workbox: {
        // Cache estratégia: network-first para API, cache-first para assets
        runtimeCaching: [
          {
            urlPattern: /^\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
              networkTimeoutSeconds: 10,
            },
          },
          {
            urlPattern: /https:\/\/fonts\.googleapis\.com/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            urlPattern: /https:\/\/fonts\.gstatic\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
        // Não deixa o SW do PWA interferir com o SW do MSW em dev
        navigateFallback: null,
      },
      // Em dev, o SW fica desativado para não conflitar com MSW
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
