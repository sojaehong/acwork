import { createApp } from 'vue'
import App from './App.vue'

import { createVuetify } from 'vuetify'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

import router from './router'

// ✅ locale 추가
import { ko } from 'vuetify/locale'

const vuetify = createVuetify({
  locale: {
    locale: 'ko',
    messages: { ko }
  }
})

createApp(App)
  .use(vuetify)
  .use(router)
  .mount('#app')
