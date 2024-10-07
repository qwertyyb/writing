<template>
  <main class="home-view">
    <header class="action-btns" v-if="hasConfig">
      <router-link :to="{ name: 'add' }" class="add-article-btn">添加新文章</router-link>
    </header>
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
      </li>
      <li class="post-item placeholder-item" v-if="!list.length">
        <p class="empty-message">你来到了没有知识的荒野</p>
      </li>
    </ul>
  </main>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { getList } from '@/services';
import { ref } from 'vue';
import { useAdminConfig } from '@/hooks/admin';

const list = ref<{ id: string | number, title: string, createdAt: string, updatedAt: string }[]>([])

const { hasConfig } = useAdminConfig()

const refresh = async () => {
  const data = await getList()
  list.value = data.map((item: any) => {
    return {
      ...item,
      createdAt: new Date(item.createdAt).toLocaleDateString(),
      updatedAt: new Date(item.updatedAt).toLocaleDateString(),
    }
  })
}
refresh()
</script>

<style scoped>
.home-view {
  max-width: 800px;
  margin: 0 auto;
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
  justify-content: space-between;
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
.empty-message {
  text-align: center;
  color: rgba(0, 0, 0, 0.64);
}
</style>
