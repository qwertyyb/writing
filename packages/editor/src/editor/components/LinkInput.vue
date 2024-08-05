<template>
  <div class="link-input">
    <div class="form-item">
      <el-input v-model="formValue.href" placeholder="链接" clearable style="width:200px"></el-input>
    </div>
    <div class="form-item btns">
      <el-button @click="clearHandler" size="small">取消链接</el-button>
      <el-button @click="confirmHandler" type="primary" size="small">确认</el-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ElInput, ElButton } from 'element-plus';
import { ref, watchEffect } from 'vue';

const props = defineProps<{ href?: string }>()
const emits = defineEmits<{ change: [{ href: string }], clear: [] }>()

const formValue = ref({ href: '' })

watchEffect(() => {
  formValue.value = {
    href: props.href ?? ''
  }
})

const confirmHandler = () => {
  emits('change', formValue.value)
}
const clearHandler = () => {
  emits('clear')
}

</script>

<style lang="less" scoped>
.form-item {
  padding: 4px 0;
  display: flex;
  &.btns {
    justify-content: flex-end;
  }
}
</style>