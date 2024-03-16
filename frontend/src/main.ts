import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus, { ClickOutside } from 'element-plus'
import 'element-plus/dist/index.css'
import 'animate.css'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.directive('click-outside', ClickOutside)

app.use(createPinia())
app.use(ElementPlus)
app.use(router)

app.mount('#app')

console.log('main app')
