<template>
  <main class="post-view">
    <div class="loader" v-if="status === 'loading'"></div>
    <template v-else-if="status === 'completed' && document">
      <div class="action-btns">
        <router-link :to="{name: 'home' }" class="back-btn">主页</router-link>
        <router-link :to="{name: 'edit', params: { id: $route.params.id } }"
          v-if="hasConfig"
          class="edit-btn"
        >编辑</router-link>
      </div>
      <h1 class="document-title">{{ document.title }}</h1>
      <document-editor
        class="document-editor"
        :editable="false"
        :model-value="document.content"
      ></document-editor>
    </template>
    <div class="error" v-else>{{ errorMsg || '你来到了没有知识的荒野' }}</div>
  </main>
</template>

<script setup lang="ts">
import DocumentEditor, { type NodeValue } from '@writing/editor';
import { getPost } from '../services';
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAdminConfig } from '@/hooks/admin';

const status = ref<'loading' | 'error' | 'completed'>('loading')
const errorMsg = ref('')
const document = ref<{ title: string, content: NodeValue }>()
const { hasConfig } = useAdminConfig()

const route = useRoute()

const refresh = async () => {
  const id = route.params.id as string
  if (!id) {
    status.value = 'error'
    errorMsg.value = '你来到了没有知识的荒野(no post id)'
    return
  }
  status.value = 'loading'
  errorMsg.value = ''
  let data: any = null
  try {
    data = await getPost(id)
  } catch(err) {
    status.value = 'error'
    errorMsg.value = '你来到了没有知识的荒野' + ((err as any).status ? (err as any).status : '')
    throw err
  }
  status.value = 'completed'
  document.value = {
    title: data.title,
    content: JSON.parse(data.content)
  }
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
.error {
  text-align: center;
  font-size: 32px;
  margin-top: 120px;
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

@media screen and (max-width: 540px) {
  .public-view {
    width: 100%;
  }
}
</style>
