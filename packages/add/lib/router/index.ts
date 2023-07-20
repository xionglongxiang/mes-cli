import {
  createRouter,
  createWebHistory,
} from 'vue-router';

import HomeView from '../views/HomeView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
        path: '/mes-page',
        name: 'MesPage',
        component: () => import('../views/mes-page/index.vue')
        },
    {
        path: '/new-function',
        name: 'NewFunction',
        component: () => import('../views/new-function/index.vue')
        },
    {
        path: '/add-vue',
        name: 'AddVue',
        component: () => import('../views/add-vue/index.vue')
        },
    {
        path: '/abcd',
        name: 'abcd',
        component: () => import('../views/abcd/index.vue')
        },
    {
        path: '/vue-page',
        name: 'VuePage',
        component: () => import('../views/vue-page/index.vue')
        },
    {
        path: '/vue-page',
        name: 'VuePage',
        component: () => import('../views/vue-page/index.vue')
        },
    {
        path: '/mission-success',
        name: 'MissionSuccess',
        component: () => import('../views/mission-success.vue')
        },
    {
      path: "/about",
      name: "about",
      component: () => import("../views/AboutView.vue"),
    },
  ],
});

export default router;
