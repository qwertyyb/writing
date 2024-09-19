<template>
  <div class="plugins-settings-view">
    <ul class="plugin-list">
      <li class="plugin-item"
        v-for="plugin in plugins"
        :key="plugin.meta.name"
      >{{ plugin.meta.title }}</li>
    </ul>
    <div class="plugin-settings">
      <!-- <m-form :config="plugins.githubPublisher.instance.settings" :init-values="initValues"></m-form> -->
    </div>
  </div>
</template>

<script lang="ts" setup>
import { plugins } from '@/plugin';
import { ref } from 'vue';

const initValues = ref({
  auth: '',
  owner: '',
  repo: ''
})
</script>