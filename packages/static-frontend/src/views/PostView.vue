<template>
  <main class="post-view">
    <div class="action-btns">
      <router-link :to="{name: 'home' }" class="back-btn">主页</router-link>
      <router-link :to="{name: 'edit', params: { id: $route.params.id } }"
        v-if="hasConfig && status === 'completed'"
        class="edit-btn"
      >编辑</router-link>
    </div>
    <h1 class="document-title">{{ document?.title }}</h1>
    <document-editor
      class="document-editor"
      :editable="false"
      v-if="document?.content"
      :model-value="document.content"
    ></document-editor>
    <div class="decrypt-error" v-if="status === 'decryptError'">
      <p class="error-msg">{{ errorMsg }}</p>
      <button class="decrypt-btn" @click="openDecryptDialog">解密</button>
    </div>
    <div class="error-msg" v-if="status === 'error'">{{ errorMsg || '你来到了没有知识的荒野' }}</div>
    <div class="loader" v-if="status === 'loading'"></div>
    <dialog ref="decryptDialog">
      <div class="form-item">
        <label for="privateKey">密钥</label>
        <textarea name="privateKey" id="privateKey" rows="10" spellcheck="false"></textarea>
      </div>
      <div class="form-item">
        <button class="confirm-btn" @click="confirmDecrypt">确认</button>
      </div>
    </dialog>
  </main>
</template>

<script setup lang="ts">
import DocumentEditor, { type NodeValue } from '@writing/editor';
import { getPost } from '../services';
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAdminConfig } from '@/hooks/admin';
import { PRIVATE_KEY, type IArticle } from '@/const';
import { decryptArticle } from '@/hooks/crypto';
import { tryRunForTuple } from 'try-run-js';
import { decrypt, importPrivateKey } from '@/utils/crypto';

const status = ref<'loading' | 'decryptError' | 'error' | 'completed'>('loading')
const errorMsg = ref('')
const decryptDialog = ref<HTMLDialogElement>()
const document = ref<{ title: string, content: NodeValue | null, originalContent: string }>({ title: '', content: null, originalContent: '' })
const { hasConfig } = useAdminConfig()

const route = useRoute()

const openDecryptDialog = () => {
  decryptDialog.value!.showModal()
}

const confirmDecrypt = async () => {
  const privateKey = decryptDialog.value!.querySelector('textarea')!.value.trim()
  if (!privateKey) {
    window.alert('请输入密钥')
    return
  }
  let content: string
  try {
    const key = await importPrivateKey(privateKey)
    content = await decrypt(document.value.originalContent, key)
  } catch (err)  {
    alert('密钥不正确')
    throw err;
  }
  document.value.content = JSON.parse(content)
  document.value.originalContent = ''
  status.value = 'completed'
  errorMsg.value = ''
  decryptDialog.value!.close()
  if(window.confirm('解密成功，是否保存密钥？')){
    localStorage.setItem(PRIVATE_KEY, privateKey)
  }
}

const refresh = async () => {
  const id = route.params.id as string
  if (!id) {
    status.value = 'error'
    errorMsg.value = '你来到了没有知识的荒野(no post id)'
    return
  }
  status.value = 'loading'
  errorMsg.value = ''
  let data: IArticle | null = null
  try {
    data = await getPost(id)
  } catch(err) {
    status.value = 'error'
    errorMsg.value = '你来到了没有知识的荒野' + ((err as any).status ? (err as any).status : '')
    throw err
  }
  if (!data) return
  if (data.encrypted) {
    if (localStorage.getItem(PRIVATE_KEY)) {
      let [err, decrypted] = await tryRunForTuple(decryptArticle(data))
      if (err) {
        status.value = 'decryptError'
        errorMsg.value = '文章解密失败，请检查密钥'
      } else {
        status.value = 'completed'
        data = decrypted!
      }
    } else {
      status.value = 'decryptError'
      errorMsg.value = '文章已加密，请输入密钥解密'
    }
  } else {
    status.value = 'completed'
  }
  document.value.title = data.title
  document.value.originalContent = data.content
  document.value.content = JSON.parse(data.content)
  document.value.originalContent = ''
}

watch(() => route.params.id, () => { refresh() }, { immediate: true })

</script>

<style lang="less" scoped>
.post-view {
  max-width: 960px;
  margin: 20px auto 60px auto;
  .document-title {
    width: calc(100% - 40px);
    font-size: 36px;
    border: none;
    outline: none;
    margin: 0.5em auto;
  }
}
/* HTML: <div class="loader"></div> */
.loader {
  width: 45px;
  margin: 60px auto 0 auto;
  aspect-ratio: 1;
  --c: no-repeat linear-gradient(#000 0 0);
  background: 
    var(--c) 0%   50%,
    var(--c) 50%  50%,
    var(--c) 100% 50%;
  background-size: 20% 100%;
  animation: l1 1s infinite linear;
}
@keyframes l1 {
  0%  {background-size: 20% 100%,20% 100%,20% 100%}
  33% {background-size: 20% 10% ,20% 100%,20% 100%}
  50% {background-size: 20% 100%,20% 10% ,20% 100%}
  66% {background-size: 20% 100%,20% 100%,20% 10% }
  100%{background-size: 20% 100%,20% 100%,20% 100%}
}
.error-msg {
  text-align: center;
  font-size: 18px;
  margin-top: 120px;
  opacity: 0.6;
}
.decrypt-btn {
  height: 36px;
  width: 120px;
  border: none;
  display: block;
  margin: 48px auto;
  cursor: pointer;
  transition: background .2s;
  border-radius: 6px;
  background: #eee;
  font-size: 14px;
  &:active {
    background: #bbb;
  }
}
.action-btns {
  display: flex;
  box-sizing: border-box;
  padding: 0 20px;
}
.edit-btn {
  margin-left: auto;
  text-align: right;
}
dialog {
  padding: 24px;
  &::backdrop {
    background: rgba(0, 0, 0, .5);
  }
}
.form-item {
  display: flex;
  flex-direction: column;
  label {
    margin-bottom: 12px;
  }
  textarea {
    width: 300px;
    border-radius: 6px;
    outline: none;
  }
  .confirm-btn {
    width: 120px;
    border-radius: 6px;
    border: none;
    height: 36px;
    margin-left: auto;
    cursor: pointer;
    transition: background .2s;
    border-radius: 6px;
    background: #eee;
    font-size: 14px;
    &:active {
      background: #bbb;
    }
  }
}
.form-item + .form-item {
  margin-top: 18px;
}

@media screen and (max-width: 540px) {
  .public-view {
    width: 100%;
  }
}
</style>
