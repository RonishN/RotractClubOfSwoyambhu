import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  plugins: process.env.NO_PWA ? [] : [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png', 'favicon.svg', 'icons.svg'],
      manifest: {
        name: 'Rotaract Club of Swoyambhu',
        short_name: 'Rotaract Swoyambhu',
        description: 'Rotaract Club of Swoyambhu — Service Above Self.',
        theme_color: '#7A1F34',
        background_color: '#f0e9dc',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/logo.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2,ttf,otf,jpg,jpeg}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: /\/api\/content$/,
            handler: 'StaleWhileRevalidate',
            method: 'GET',
            options: {
              cacheName: 'content',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            urlPattern: /\/api\/events$/,
            handler: 'NetworkFirst',
            method: 'GET',
            options: {
              cacheName: 'events',
              networkTimeoutSeconds: 3,
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            urlPattern: /^https:\/\/ik\.imagekit\.io\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'imagekit-images',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
});
