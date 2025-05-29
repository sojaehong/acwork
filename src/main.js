import { createApp } from 'vue'
import App from './App.vue'

import { createVuetify } from 'vuetify'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

import router from './router'

const vuetify = createVuetify()

createApp(App)
  .use(vuetify)
  .use(router)
  .mount('#app')
