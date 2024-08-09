<template>
  <el-form label-width="100px" @submit.prevent>
    <el-form-item label="禁用密码登录">
      <el-switch :model-value="settingValue.passwordDisabled"
        @change="setPasswordDisabled"></el-switch>
    </el-form-item>
    <template v-if="!settingValue.passwordDisabled">
      <el-form-item label="密码">
        <el-input type="password" v-model="settingValue.password" autocomplete="new-password"></el-input>
      </el-form-item>
      <el-form-item label="重复密码">
        <el-input type="password" v-model="settingValue.passowrd2"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="setPassword" :disabled="!settingValue.password || !settingValue.passowrd2">重新设置密码</el-button>
      </el-form-item>
    </template>
  </el-form>
  <h4>无密码登录管理</h4>
  <el-table :data="settingValue.authenticators" class="authenticator-table">
    <el-table-column prop="name" label="名字" width="100"></el-table-column>
    <el-table-column prop="createdAt" label="创建时间" :formatter="formatRowTime" width="120"></el-table-column>
    <el-table-column label="操作" width="80">
      <template #default="scope">
        <el-button size="small"
          type="danger"
          @click="removeAuthenticator(scope.$index)">删除</el-button>
      </template>
    </el-table-column>
  </el-table>
  <div class="authenticator-add-row" v-if="supportsWebAuthn">
    <el-button type="primary" @click="addAuthenticator">添加新的设备</el-button>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as R from 'ramda'
import { ElMessage, ElMessageBox } from 'element-plus';
import { getRegisterOptions, verifyRegister } from '@/services/server/auth';
import { startRegistration, browserSupportsWebAuthn } from '@simplewebauthn/browser';
import { configService } from '@/services/server/config';

const settingValue = ref<Record<string, any>>({
  passwordDisabled: false,
  password: '',
  password2: '',

  authenticators: []
})
const supportsWebAuthn = ref(browserSupportsWebAuthn())

const getSettingValue = async () => {
  const values = await configService.getValues(['PasswordDisabled', 'WebAuthnAuthenticators'])
  const obj = values.reduce<Record<string, any>>((acc, item) => {
    let value = item.value
    if (item.key === 'WebAuthnAuthenticators') {
      value = JSON.parse(item.value)
    }
    return {
      ...acc,
      [item.key]: value
    }
  }, {})
  settingValue.value.authenticators = obj.WebAuthnAuthenticators ?? settingValue.value.authenticators
  settingValue.value.passwordDisabled = !!(obj.PasswordDisabled ?? settingValue.value.passwordDisabled)
}

const setPasswordDisabled = async (value: boolean) => {
  if (!settingValue.value.authenticators.length) {
    return ElMessage.error('需要先添加无密码登录设备才能禁用密码登录')
  }
  await configService.setValue('PasswordDisabled', value ? 'true' : '')
  settingValue.value.passwordDisabled = value
}

const setPassword = async () => {
  if (!settingValue.value.password) {
    return ElMessage.error('未输入密码')
  }
  if (settingValue.value.password !== settingValue.value.passowrd2) {
    return ElMessage.error('两次密码输入不一致')
  }
  await configService.setValue('Password', settingValue.value.password)
  settingValue.value.password = ''
  settingValue.value.passowrd2 = ''
}

const removeAuthenticator = async (index: number) => {
  const value = R.remove(index, 1, settingValue.value.authenticators)
  await configService.setValue('WebAuthnAuthenticators', JSON.stringify(value))
  settingValue.value.authenticators = value
}

const webAuthnRegister = async (name: string) => {
  const { data } = await getRegisterOptions()
  const result = await startRegistration(data)
  await verifyRegister({ name, body: result })
}

const addAuthenticator = async () => {
  const { value: inputValue } = await ElMessageBox.prompt('请输入设备名', 'Tip', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    inputPattern: /\w+/,
    inputErrorMessage: '请输入设备名',
    inputPlaceholder: '请输入设备名'
  })
  await webAuthnRegister(inputValue.trim())
  getSettingValue()
}

const formatRowTime = (row: any, column: any, cellValue: number) => {
  return new Date(cellValue).toLocaleDateString('zh-CN', { hour12: false })
}

getSettingValue()

</script>

<style lang="less">
.authenticator-add-row {
  display: flex;
  margin: 12px 0;
}
</style>