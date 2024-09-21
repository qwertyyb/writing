<template>
  <div class="plugins-settings-view">
    <div class="toggle-section">
      <div class="toggle-label">启用</div>
      <el-switch :model-value="plugin.status"
        active-value="enabled"
        inactive-value="disabled"
        @change="updatePluginStatus"
      ></el-switch>
    </div>
    <template v-if="plugin.status === 'enabled'">
      <div class="has-settings-content" v-if="pluginInstance?.settings">
        <m-form
          ref="form"
          label-width="80px"
          :config="pluginInstance.settings"
          :init-values="initValues"
        ></m-form>
        <div class="btns">
          <el-button class="reset-btn" @click="resetToDefault">恢复默认</el-button>
          <el-button type="primary" class="submit-btn" @click="submit">保存</el-button>
        </div>
      </div>
      <div class="no-settings-content" v-else>
        该插件没有提供配置项
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { pluginsRuntime, pluginInstances, togglePlugin } from '@/plugin';
import { service } from '@/services';
import { MForm } from '@tmagic/form';
import { ElMessage, ElMessageBox, ElSwitch } from 'element-plus';
import { computed, ref } from 'vue';

const props = defineProps<{
  name: string
}>()

const form = ref<InstanceType<typeof MForm>>()

const plugin = computed(() => pluginsRuntime[props.name])
const pluginInstance = computed(() => pluginInstances[props.name])

const initValues = ref(pluginsRuntime[props.name]?.settingsValue ?? {})

const resetToDefault = async () => {
  // @todo 尙待实现
  await ElMessageBox.confirm('恢复默认后，当前配置将被覆盖无法找回，是否确认恢复？')
  ElMessage.info('此功能正在开发中')
}

const submit = async () => {
  const values = await form.value?.submitForm()
  if (!pluginsRuntime[props.name]) return;
  pluginsRuntime[props.name]!.settingsValue = values
  await service.configService.setValue(`Plugin.${props.name}`, JSON.stringify({
    status: pluginsRuntime[props.name]!.status,
    settingsValue: values
  }))
  ElMessage.success('保存成功')
}

const updatePluginStatus = (status: string | number | boolean) => {
  const oldStatus = pluginsRuntime[props.name].status
  // pluginsRuntime[props.name].status = status as 'enabled' | 'disabled'
  if (
    oldStatus === 'disabled' && status === 'enabled'
    || oldStatus === 'enabled' && status === 'disabled'
  ) {
    togglePlugin(props.name, status)
    ElMessage.success(`插件${pluginsRuntime[props.name].meta.title}已${status === 'enabled' ? '启用' : '禁用' }`)
  }
}

</script>

<style lang="less" scoped>
.toggle-section {
  display: flex;
  align-items: center;
  margin-bottom: 2em;
  .toggle-label {
    box-sizing: border-box;
    width: 80px;
    text-align: right;
    padding-right: 12px;
  }
}
.has-settings-content {
  display: flex;
  flex-direction: column;
  .btns {
    margin: auto;
  }
}
</style>