
日常文字沉淀和分享



### 特性

1. 以块为基础，使用Web技术构建，自带跨平台属性

2. 集成 Excalidraw 画板

3. 无限层级

4. 以 SQLite 单文件为存储方案

5. 集成密码鉴权、无密码 WebAuthn 鉴权

6. 支持分享

7. Markdown 导出



### 安装

目前仅支持 docker 方式安装

```
docker run --name writing -p 4000:4000 -v ~/writing:/data qwertyyb/writing:dev
```


### 开发

```
pnpm install

# 启动开发server端
pnpm run start

# 启动前端
cd frontend && pnpm run dev
```

