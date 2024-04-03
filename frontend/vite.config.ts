import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    vue(),
    vueJsx(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024 // 最大缓存资源20M
      },
      manifest: {
        "name": 'write what you think',
        "short_name": "writing",
        "icons": [
          {
            "src": "/icons/android-chrome-192x192.png",
            "sizes": "192x192",
            "type": "image/png"
          },
          {
            "src": "/icons/android-chrome-512x512.png",
            "sizes": "512x512",
            "type": "image/png"
          },
          {
            src: '/icons/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        "theme_color": "#ffffff",
        "background_color": "#ffffff",
        "display": "standalone"
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // '@writing/editor': fileURLToPath(new URL('../packages/editor/src/DocumentEditor.vue', import.meta.url))
    }
  },
  server: {
    proxy: {
      '/api': 'http://localhost:4000',
      '/remote': {
        target: 'http://localhost:4100',
        changeOrigin: true,
        rewrite(path) {
          return path.replace('/remote', '/api')
        },
      }
    },
  }
})
