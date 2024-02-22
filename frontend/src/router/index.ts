import { RouterView, createRouter, createWebHistory } from 'vue-router'
import PublicView from '@/views/PublicView.vue'
import AuthViewVue from '@/views/AuthView.vue'
import LayoutViewVue from '@/views/LayoutView.vue'
import DocumentViewVue from '@/views/DocumentView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: RouterView,
      children: [
        {
          path: 'admin',
          name: 'admin',
          component: LayoutViewVue,
          children: [
            {
              path: 'document/:id?',
              name: 'document',
              component: DocumentViewVue,
              props: true,
            }
          ]
        },
      ]
    },
    {
      path: '/auth',
      name: 'auth',
      component: AuthViewVue,
    },
    {
      path: '/public/:id',
      name: 'public',
      component: PublicView
    }
  ]
})

export default router
