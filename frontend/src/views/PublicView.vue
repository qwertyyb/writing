<template>
  <main class="home-view">
    <div class="spliter"></div>
    <div class="doc-editor">
      <div class="doc-editor-wrapper">
        <document-editor
          mode="Readonly"
          v-if="document"
          :model-value="document"
        ></document-editor>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import DocumentEditor from '@writing/editor';
import { documentService } from '@/services';
import { ref, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import type { BlockModel } from '@writing/editor/block';

const document = ref<BlockModel>()

const route = useRoute()

watchEffect(async () => {
  const id = route.params.id as string
  if (!id) return
  const { data } = await documentService.findByShareId({ id })
  
  document.value = JSON.parse(data.doc!.content)
})

</script>

<style lang="less" scoped>
.home-view {
  display: flex;
  .doc-editor {
    flex: 4;
    max-height: 100vh;
    height: 100%;
    overflow: auto;
    .doc-editor-wrapper {
      width: 80%;
      max-width: 1200px;
      margin: 0 auto;
    }
  }
}
</style>
