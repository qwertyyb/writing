<template>
  <div class="export-data-view">
    <el-button type="primary" @click="exportData">导出数据</el-button>
  </div>
</template>

<script setup lang="ts">
import { service } from '@/services';
import { FileSystemServer } from '@/services/fs/fs';
import { useDocumentStore } from '@/stores/document';
import { ElButton } from 'element-plus';

const getFilePaths = (content: string) => {
  const reg = /\/api\/v1\/file\?name=([^"]+)/g
  const pathList = [...content.matchAll(reg)]
  return pathList.map((match) => ({ path: match[0], name: match[1] }))
}

const prepareData = async () => {
  const store = useDocumentStore()
  const documents = store.documents
  const results = await Promise.allSettled(store.documents.map(post => service.documentService.find({ id: post.id })))
  let posts = results.filter(item => item.status === 'fulfilled').map(item => item.value.data)
  const fileUrls = posts.map(post => {
    const infos = getFilePaths(post.content)
    return infos.map(item => ({ ...item, postId: post.id }))
  }).flat()
  const files = await Promise.all(
    fileUrls.map(item => fetch(item.path)
    .then(resp => resp.blob())
    .then(blob => ({ ...item, blob }))
  ))
  posts = posts.map(post => {
    return {
      ...post,
      content: files.reduce((content, file) => {
        return content.replaceAll(file.path, `/api/v1/fs/fileNotExist?name=${file.name}`)
      }, post.content)
    }
  })
  console.log(fileUrls)
  console.log(JSON.parse(JSON.stringify({ documents, posts })))
  return { files, documents, posts }
}

const exportData = async () => {
  const { files, documents, posts } = await prepareData()
  const fs = new FileSystemServer()
  await fs.authDirectory()
  fs.writeJSON({ document: documents, config: [], file: [] }, 'meta.json')
  await Promise.all(posts.map(post => fs.writeJSON(post, `posts/${post.id}.json`)))
  await Promise.all(files.map(file => fs.writeFile(file.blob, `resources/${file.name}`)))
}
</script>