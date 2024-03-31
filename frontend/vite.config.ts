import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    vue(),
    vueJsx(),
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
