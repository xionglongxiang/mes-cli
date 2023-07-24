import { createRouter, createWebHistory } from "vue-router";

import HomeView from "../views/HomeView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/page13",
      name: "Page13",
      component: () => import("../src/views/page13/index.vue"),
    },
    {
      path: "/page-twlve",
      name: "PageTwlve",
      component: () => import("../src/views/page-twlve/index.vue"),
    },
  ],
});

export default router;
