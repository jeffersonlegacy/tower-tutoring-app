import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Tower Tutoring',
        short_name: 'Tower',
        description: 'Next-Gen Educational Arcade & Tutoring Platform',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4MB
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true
      }
    })
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: {
          // React core (rarely changes)
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Firebase SDK (split to avoid loading unused services)
          'vendor-firebase-core': ['firebase/app', 'firebase/auth'],
          'vendor-firebase-db': ['firebase/firestore', 'firebase/database'],
          'vendor-firebase-extra': ['firebase/storage', 'firebase/analytics', 'firebase/performance', 'firebase/remote-config'],
          // Heavy canvas lib for whiteboard
          'vendor-tldraw': ['@tldraw/tldraw'],
        }
      }
    }
  },
})
