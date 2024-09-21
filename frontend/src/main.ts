import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus, { ClickOutside } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import TMagicDesign from '@tmagic/design';
import MagicElementPlusAdapter from '@tmagic/element-plus-adapter';
import MagicForm from '@tmagic/form';
import 'element-plus/dist/index.css'
import 'material-symbols';

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.directive('click-outside', ClickOutside)

app.use(createPinia())
app.use(ElementPlus, {
  locale: zhCn
})
app.use(router)
app.use(TMagicDesign, MagicElementPlusAdapter);
app.use(MagicForm);

app.mount('#app')
