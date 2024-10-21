<template>
  <section class="edit-view">
    <template v-if="status === 'completed'">
      <header class="action-btns">
        <router-link :to="{name:'home'}">主页</router-link>
        <a href="javascript:void(0)" class="publish-btn" @click="publish">发布</a>
      </header>
      <input class="document-title" :value="document.title" @input="updateEditingArticle({ title: ($event.target as HTMLInputElement).value })" />
      <document-editor
        class="document-editor"
        :upload="uploadFile"
        :editable="true"
        :model-value="document.content"
        @update:model-value="updateEditingArticle({ content: JSON.stringify($event) })"
      ></document-editor>
    </template>
    <submit-dialog ref="submitDialogRef"></submit-dialog>
  </section>
</template>

<script setup lang="ts">
import DocumentEditor, { type NodeValue } from '@writing/editor';
import { markRaw, ref } from 'vue';
import { useRoute } from 'vue-router';
import { tryRunForTuple } from 'try-run-js';
import { ElLoading, ElMessage } from 'element-plus';
import router from '@/router';
import SubmitDialog from '@/components/SubmitDialog.vue';
import { useEdit } from '@/hooks/edit';

const route = useRoute()

const { updateEditingArticle, uploadFile, startEditArticle, publishArticle } = useEdit(route.params.id as string)

const status = ref<'loading' | 'error' | 'completed'>('loading')
const document = ref<{ title: string, content: NodeValue, encrypted: boolean }>({
  title: '标题',
  encrypted: false,
  content: markRaw({
    type: 'doc',
    "content": [
          {
              "type": "paragraph",
              "attrs": {
                  "align": "left"
              },
              "content": [
                  {
                      "type": "text",
                      "text": "内容"
                  }
              ]
          }
      ]
  })
})
const submitDialogRef = ref<InstanceType<typeof SubmitDialog>>()

const refresh = async () => {
  const loading = ElLoading.service({ fullscreen: true, text: '正在加载中...'})
  const data = await startEditArticle()
  console.log(data)
  document.value = {
    title: data.title,
    encrypted: data.encrypted ?? false,
    content: markRaw(JSON.parse(data.content))
  }
  status.value = 'completed'
  loading.close()
}

refresh()

const publish = async () => {
  let id = route.params.id as string
  // 没有id，是新建的文章，则 prompt 要用户输入一个文件名
  // const { value } = await ElMessageBox.prompt('请输入文件名', '提示', {
  //   inputPattern: /^[a-zA-Z0-9_-]+$/,
  //   inputErrorMessage: '文件名应只包含字母、数字或-、_'
  // })
  const options = await submitDialogRef.value!.confirm({
    name: id,
    crypto: document.value.encrypted
  })
  console.log(options)
  const loading = ElLoading.service({ fullscreen: true, text: '发布中...' })
  const [err] = await tryRunForTuple(publishArticle({ newArticleId: options.name, crypto: options.crypto }))
  loading.close()
  if (err) {
    ElMessage.error(err.message || err)
  } else {
    ElMessage.success('已发布，该文章将在几分钟内部署到现网')
  }
  router.replace({ name: 'home' })
}


</script>

<style lang="less" scoped>
.edit-view {
  max-width: 960px;
  margin: 20px auto;
}
.action-btns {
  display: flex;
  padding: 0 20px;
}
.publish-btn {
  margin-left: auto;
}
.document-title {
  font-size: 36px;
  padding: 0 20px;
  border: none;
  outline: none;
  margin: 0.5em auto;
  box-sizing: border-box;
  width: 100%;
  font-family: inherit;
}
.form-submit-btn {
  margin-left: auto;
}
</style>