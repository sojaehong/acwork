import { createApp } from 'vue'
import App from './App.vue'

import { createVuetify } from 'vuetify'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

import router from './router'
import { createPinia } from 'pinia'

// PWA 등록
import { registerSW } from 'virtual:pwa-register'

// Pinia 생성
const pinia = createPinia()

const vuetify = createVuetify({
  locale: {
    locale: 'ko',
    messages: {},
  },
})

// PWA 업데이트 처리
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('PWA 업데이트가 가능합니다.')
  },
  onOfflineReady() {
    console.log('PWA가 오프라인에서 사용 가능합니다.')
  },
})

createApp(App)
  .use(pinia) // Pinia 사용
  .use(vuetify)
  .use(router)
  .mount('#app')
