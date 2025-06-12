import { createApp } from 'vue'
import App from './App.vue'

import { createVuetify } from 'vuetify'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

import router from './router'
import { createPinia } from 'pinia'

// Pinia 생성
const pinia = createPinia()

const vuetify = createVuetify({
  locale: {
    locale: 'ko',
    messages: {  }
  }
})

createApp(App)
  .use(pinia)  // Pinia 사용
  .use(vuetify)
  .use(router)
  .mount('#app')
