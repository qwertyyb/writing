<template>
  <el-dialog title="保存提示" v-model="visible">
    <el-form class="save-form" :model="form" :rules="rules" ref="formRef">
      <el-form-item label="文件名" required prop="name" v-if="nameVisible">
        <el-input v-model="form.name"></el-input>
      </el-form-item>
      <el-form-item label="加密" prop="crypto">
        <el-switch v-model="form.crypto"></el-switch>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" class="form-submit-btn" @click.prevent="submit">确认</el-button>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script setup lang="ts">
import type { ElForm, FormRules } from 'element-plus';
import { ref } from 'vue';

interface IForm {
  name: string,
  crypto: boolean
}

const visible = ref(false)
const nameVisible = ref(false)
const form = ref({ name: '', crypto: false })
const formRef = ref<InstanceType<typeof ElForm>>()
const rules = ref<FormRules<IForm>>({
  name: [
    { required: true, message: '请填写名字', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_-]+$/, message: '文件名应只包含字母、数字或-、_', trigger: 'blur' }
  ]
})

const submit = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return
  cbResolve(form.value)
  visible.value = false
}

let cbResolve: Function
let cbReject: Function

defineExpose({
  confirm(initialValue?: Partial<IForm>) {
    form.value = { ...form.value, ...initialValue }
    nameVisible.value = !initialValue?.name
    visible.value = true
    return new Promise<IForm>((resolve, reject) => {
      cbReject = reject
      cbResolve = resolve
    })
  }
})

</script>