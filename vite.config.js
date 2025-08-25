import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'url'

export default defineConfig({
  publicDir: 'public',
  plugins: [
    vue(),
    vuetify({
      autoImport: true,
      theme: {
        defaultTheme: 'light',
      },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      },
      includeAssets: ['vite.svg'],
      manifest: {
        name: '공조+',
        short_name: '공조+',
        description: '현장 작업자 일정 관리 및 급여 계산 시스템',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'vite.svg',
            sizes: '144x144',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // 청크 크기 경고 임계값 증가
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // 🚀 수동 청크 분할로 번들 최적화
        manualChunks: {
          // 핵심 프레임워크
          'vue-core': ['vue', 'vue-router', 'pinia'],

          // UI 프레임워크
          'vuetify-core': ['vuetify'],

          // PDF 생성 라이브러리 (가장 큰 번들)
          'pdf-libs': ['jspdf', 'html2canvas'],

          // Firebase
          firebase: ['firebase/app', 'firebase/firestore', 'firebase/auth'],

          // 유틸리티 라이브러리
          utils: ['lodash', 'date-fns'],

          // 폼 관련
          'form-libs': ['flatpickr', 'vue-flatpickr-component'],

          // VueUse 유틸리티
          vueuse: ['@vueuse/core'],
        },
        // 파일명 최적화
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // 더 나은 트리 셰이킹을 위한 설정
    target: 'esnext',
    minify: 'esbuild', // terser 대신 더 빠른 esbuild 사용
    sourcemap: false,
  },
  // 개발 서버 최적화
  server: {
    warmup: {
      clientFiles: ['./src/main.js', './src/pages/Home.vue'],
    },
  },
  // CSS 최적화
  css: {
    devSourcemap: false,
  },
  // 최적화 설정
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      'vuetify',
      '@vueuse/core',
      'date-fns',
      'firebase/app',
      'firebase/firestore',
      'firebase/auth',
    ],
    exclude: ['jspdf', 'html2canvas'], // 큰 라이브러리는 필요시에만 로드
  },
})
