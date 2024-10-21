<template>
  <section class="home-view">
    <header>
      <img src="https://api.vvhan.com/api/bing?size=1920" alt="" class="cover">
    </header>
    <main>
      <div class="action-btns" v-if="hasConfig">
        <router-link :to="{ name: 'add' }" class="add-article-btn">添加新文章</router-link>
      </div>
      <ul class="post-list">
        <li class="post-item" v-for="(post, index) in list" :key="index">
          <div class="article-info">
            <router-link :to="{name: 'post', params: {id: post.id}}" :title="post.title">
              <h3 class="post-title">{{ post.title }}</h3>
            </router-link>
            <div class="post-created-time">{{ post.createdAt }}</div>
          </div>
          <router-link :to="{name: 'edit', params: { id: post.id } }"
            v-if="hasConfig"
            class="edit-btn"
          >编辑</router-link>
          <a href="javascript:void(0)"
            v-if="hasConfig"
            class="del-btn"
            @click="deleteAction(post, index)"
            v-loading="deleting === post.id"
          >删除</a>
        </li>
        <li class="post-item placeholder-item" v-if="loading">
          <p class="empty-message">加载中...</p>
        </li>
        <li class="post-item placeholder-item" v-else-if="!list.length">
          <p class="empty-message">你来到了没有知识的荒野</p>
        </li>
      </ul>
    </main>
  </section>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { getList } from '@/services';
import { ref } from 'vue';
import { useAdminConfig } from '@/hooks/admin';
import { ElMessage, ElMessageBox } from 'element-plus';
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'
import { tryRunForTuple } from 'try-run-js';
import { deleteArticle } from '@/hooks/github';

const list = ref<{ id: string | number, title: string, createdAt: string, updatedAt: string }[]>([])
const loading = ref(false)
const deleting = ref<number | string>()

const { hasConfig } = useAdminConfig()

const refresh = async () => {
  loading.value = true
  const data = await getList()
  list.value = data.map((item: any) => {
    return {
      ...item,
      createdAt: new Date(item.createdAt).toLocaleDateString(),
      updatedAt: new Date(item.updatedAt).toLocaleDateString(),
    }
  })
  loading.value = false
}
refresh()

const deleteAction = async (article: { id: string | number, title: string, createdAt: string, updatedAt: string }, index: number) => {
  await ElMessageBox.confirm(`确认删除 ${JSON.stringify(article.title)}?`)
  deleting.value = article.id
  const [error] = await tryRunForTuple(deleteArticle(article.id))
  if (error) {
    ElMessage.error(error.message || '删除失败')
  } else {
    ElMessage.success('已删除')
  }
  list.value.splice(index, 1)
}

</script>

<style scoped>
.home-view header {
  .cover {
    width: 100%;
    height: 50vh;
    object-fit: cover;
  }
}
.home-view main {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 16px;
}
.add-article-btn:visited {
  color: blue;
}
.action-btns {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
.post-list {
  list-style: none;
  padding: 0;
}
.post-list .post-item {
  padding: 12px 0;
  display: flex;
}
.post-list .post-item .edit-btn {
  margin-left: auto;
  margin-right: 1em;
}
.post-list .post-item .del-btn {
  color: red;
}
.post-list .post-item a {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.post-list .post-item + .post-item {
  border-top: 1px solid #bbb;
}
.post-list .post-title {
  margin: 0 0 4px 0;
  font-size: 22px;
  color: #000;
}
.post-list .post-created-time {
  color: rgba(0, 0, 0, 0.65);
  font-size: 14px;
}
.post-list .post-item.placeholder-item {
  justify-content: center;
}
.empty-message {
  text-align: center;
  color: rgba(0, 0, 0, 0.64);
}
</style>
