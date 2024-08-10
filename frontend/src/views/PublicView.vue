<template>
  <main class="public-view" v-if="document">
    <h1 class="document-title">{{ document.title }}</h1>
    <document-editor
      class="document-editor"
      :editable="false"
      :model-value="document.content"
    ></document-editor>
  </main>
</template>

<script setup lang="ts">
import DocumentEditor, { type NodeValue } from '@writing/editor';
import { documentService } from '@/services';
import { ref, watchEffect } from 'vue';
import { useRoute } from 'vue-router';

const document = ref<{ title: string, content: NodeValue }>()

const route = useRoute()

watchEffect(async () => {
  const id = route.params.id as string
  if (!id) return
  const { data } = await documentService.findByShareId({ id })
  
  document.value = {
    title: data.doc.title,
    content: JSON.parse(data.doc!.content)
  }
})

</script>

<style lang="less" scoped>
.public-view {
  width: 80vw;
  margin: 20px auto 60px auto;
  max-width: 1200px;
  .document-title {
    width: calc(100% - 40px);
    font-size: 36px;
    border: none;
    outline: none;
    margin: 0 20px;
  }
}
@media screen and (max-width: 540px) {
  .public-view {
    width: 100%;
  }
}
</style>
