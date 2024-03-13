<template>
  <div class="settings-view">
    <div class="settings-side">
      <el-menu>
        <el-menu-item index="password">
          <el-icon><Avatar /></el-icon>
          <template #title>密码</template>
        </el-menu-item>
      </el-menu>
    </div>
    <div class="settings-main">
      <el-form label-width="100px">
        <el-form-item>
          <h3>重设密码</h3>
        </el-form-item>
        <el-form-item label="禁用密码登录">
          <el-switch :model-value="settingValue.passwordDisabled"
            @change="setPasswordDisabled"></el-switch>
        </el-form-item>
        <el-form-item label="密码">
          <el-input type="password" v-model="settingValue.password"></el-input>
        </el-form-item>
        <el-form-item label="重复密码">
          <el-input type="password" v-model="settingValue.passowrd2"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary">重新设置密码</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="settingValue.authenticators">
        <el-table-column type="index" width="50" />
        <el-table-column prop="name" label="名字" width="100"></el-table-column>
        <el-table-column prop="createdAt" label="创建时间" :formatter="formatRowTime"></el-table-column>
        <el-table-column label="操作">
          <template #default="scope">
            <el-button size="small"
              type="danger"
              @click="removeAuthenticator(scope.$index)">删除</el-button>
          </template>
        </el-table-column>
        <template #append v-if="supportsWebAuthn">
          <div class="authenticator-add-row">
            <el-button type="primary" @click="addAuthenticator">添加新的设备</el-button>
          </div>
        </template>
      </el-table>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Avatar } from '@element-plus/icons-vue';
import { ref } from 'vue';
import * as R from 'ramda'
import { ElMessageBox } from 'element-plus';
import { getRegisterOptions, verifyRegister } from '@/services/auth';
import { startRegistration, browserSupportsWebAuthn } from '@simplewebauthn/browser';
import { getValues, setValue } from '@/services/config';

const settingValue = ref<Record<string, any>>({
  passwordDisabled: false,
  password: '',
  password2: '',

  authenticators: [
    { name: 'MacOS', createdAt: '2024-02-14 14:00:00' }
  ]
})
const supportsWebAuthn = ref(browserSupportsWebAuthn())

const getSettingValue = async () => {
  const values = await getValues(['PasswordDisabled', 'Password', 'WebAuthnAuthenticators'])
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
  settingValue.value.password = obj.Password ?? settingValue.value.password
}

const setPasswordDisabled = async (value: boolean) => {
  await setValue('PasswordDisabled', value ? 'true' : '')
  settingValue.value.passwordDisabled = value
}

const removeAuthenticator = async (index: number) => {
  const value = R.remove(index, 1, settingValue.value.authenticators)
  await setValue('WebAuthnAuthenticators', JSON.stringify(value))
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

<style lang="less" scoped>
.settings-view {
  display: flex;
  .settings-side {
    flex: 1;
  }
  .settings-main {
    flex: 4;
  }
}
.authenticator-add-row {
  display: flex;
  margin: 12px 0;
  justify-content: center;
}
</style>