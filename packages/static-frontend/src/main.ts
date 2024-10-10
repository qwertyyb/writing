
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { ElLoading } from 'element-plus'

const app = createApp(App)

app.use(router)
app.use(ElLoading)

app.mount('#app')
