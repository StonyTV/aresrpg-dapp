import { createRouter, createWebHistory } from 'vue-router';

import home from './views/home.vue';
import microsoft_oauth from './views/microsoft.oauth.vue';
import discord_oauth from './views/discord.oauth.vue';
import gtla from './views/gtla.vue';
import inventory from './views/tab-inventory.vue';
import settings from './views/tab-settings.vue';
import world from './views/tab-world.vue';
import profiles from './views/tab-profiles.vue';
import terrainEditor from './views/tab-terrain-editor.vue';
import { VITE_ENABLE_TERRAIN_EDITOR } from './env';

export default createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/:catchAll(.*)',
      redirect: '/profiles',
    },
    {
      path: '/',
      component: home,
      redirect: '/profiles',
      children: [
        {
          name: 'profiles',
          path: '/profiles',
          component: profiles,
        },
        {
          name: 'world',
          path: '/world',
          component: world,
        },
        {
          name: 'inventory',
          path: '/inventory',
          component: inventory,
        },
        {
          name: 'settings',
          path: '/settings',
          component: settings,
        },
        {
          name: 'terrain-editor',
          path: '/terrain-editor',
          component: terrainEditor,
          beforeEnter: () => {
            if (!VITE_ENABLE_TERRAIN_EDITOR) return false;
          },
        },
        {
          path: '/minecraft-oauth',
          component: microsoft_oauth,
        },
        {
          path: '/discord-oauth',
          component: discord_oauth,
        },
      ],
    },
    {
      name: 'gtla',
      path: '/gtla/:uuid',
      component: gtla,
    },
  ],
});
