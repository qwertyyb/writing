import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import PublicView from '@/views/PublicView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/home',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/public/:id',
      name: 'public',
      component: PublicView
    }
  ]
})

export default router
