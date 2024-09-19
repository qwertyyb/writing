<template>
  <div class="plugins-settings-view">
    <m-form
      label-width="80px"
      v-if="plugin?.instance?.settings"
      :config="plugin?.instance?.settings"
      :init-values="initValues"
      @change="updatePluginSettingsValue"
    ></m-form>
    <div class="no-settings-content" v-else>
      该插件没有提供配置项
    </div>
  </div>
</template>

<script lang="ts" setup>
import { plugins, pluginsRuntime } from '@/plugin';
import { computed, ref } from 'vue';

const props = defineProps<{
  name: string
}>()

const plugin = computed(() => plugins[props.name])

const initValues = ref(pluginsRuntime[props.name]?.settingsValue ?? {})

const updatePluginSettingsValue = (values: any) => {
  if (!pluginsRuntime[props.name]) return;
  pluginsRuntime[props.name]!.settingsValue = values
}

</script>