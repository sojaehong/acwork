import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { fileURLToPath, URL } from 'url'

export default defineConfig({
  publicDir: 'public',
  plugins: [
    vue(),
    vuetify({ autoImport: true })  // ✅ Vuetify 플러그인 설정
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
