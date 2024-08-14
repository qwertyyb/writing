import { RouterView, createRouter, createWebHistory } from 'vue-router'
import PublicView from '@/views/PublicView.vue'
import LayoutViewVue from '@/views/LayoutView.vue'
import DocumentViewVue from '@/views/DocumentView.vue'
import { AuthError } from '@/services/types'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: RouterView,
      redirect: 'admin',
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
            },
            ...(
              // 使用前端indexed模式时，不需要鉴权
              import.meta.env.MODE !== 'indexeddb' ? [{
                path: 'settings',
                name: 'settings',
                component: () => import('@/views/SettingsView.vue'),
                children: [
                  {
                    path: 'auth',
                    name: 'authSettings',
                    component: () => import('@/views/AuthSettingsView.vue')
                  },
                  {
                    path: 'file',
                    name: 'fileSettings',
                    component: () => import('@/views/FileSettingsView.vue')
                  }
                ]
              }] : []
            )
          ]
        },
      ]
    },
    ...(
      // 使用前端indexed模式时，不需要鉴权
      import.meta.env.MODE !== 'indexeddb' ? [{
        path: '/auth',
        name: 'auth',
        component: () => import('@/views/AuthView.vue'),
      }] : []
    ),
    {
      path: '/public/:id',
      name: 'public',
      component: PublicView
    }
  ]
})

window.addEventListener('error', (event) => {
  if (event.error instanceof AuthError) {
    if (router.currentRoute.value.name !== 'auth') {
      router.replace({
        name: 'auth',
        query: {
          ru: router.currentRoute.value.fullPath || ''
        }
      })
    }
  }
})

export default router