<template>
  <main class="home-view">
    <ul class="post-list">
      <li class="post-item" v-for="post in list" :key="post.id">
        <router-link :to="{name: 'post', params: {id: post.id}}" :title="post.title">
          <h3 class="post-title">{{ post.title }}</h3>
          <div class="post-info">
            <div class="post-created-time">{{ post.createdAt }}</div>
          </div>
        </router-link>
      </li>
    </ul>
  </main>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { getList } from '@/services';
import { ref } from 'vue';

const list = ref<{ id: string | number, title: string, createdAt: string, updatedAt: string }[]>([])

const refresh = async () => {
  const data = await getList()
  list.value = data.map((item: any) => {
    return {
      ...item,
      createdAt: new Date(item.createdAt).toLocaleDateString(),
      updatedAt: new Date(item.updatedAt).toLocaleDateString(),
    }
  })

  console.log(data)
}

refresh()
</script>

<style scoped>
.post-list {
  list-style: none;
  padding: 0;
  max-width: 800px;
  margin: 0 auto;
}
.post-list .post-item {
  padding: 10px 0;
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
}
.post-list .post-info {
  color: rgba(0, 0, 0, 0.65);
}
</style>
