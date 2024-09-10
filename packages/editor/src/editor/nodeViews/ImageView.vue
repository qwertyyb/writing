<template>
  <figure data-prosemirror-dom class="editor-image-node"
    :class="'align-' + node.attrs.align"
    ref="containerEl"
    :style="{
      width: node.attrs.size + '%',
      marginLeft: node.attrs.align === 'left' ? '0' : 'auto',
      marginRight: node.attrs.align === 'right' ? '0' : 'auto'
    }">
    <el-tooltip
      placement="top"
      trigger="click"
      width="fit-content"
      @after-leave="linkInputVisible = false"
      :disabled="!editable"
      :trigger-keys="[]"
    >
      <a :href="node.attrs.href"
        v-if="node.attrs.href"
        class="editor-image-node-link">
        <img
          draggable="false"
          class="editor-image-node-image"
          :src="node.attrs.src || 'https://fakeimg.pl/200'"
          :style="{ aspectRatio: node.attrs.ratio }"
          alt=""
        >
      </a>
      <img
        v-else
        draggable="false"
        class="editor-image-node-image"
        :src="node.attrs.src || 'https://fakeimg.pl/200'"
        :style="{ aspectRatio: node.attrs.ratio }"
        alt=""
      >
      <template #content>
        <ul class="action-list" v-if="!linkInputVisible">
          <li class="action-item replace-action material-symbols-outlined"
            title="更换图片"
            @click="selectImage"
          >image</li>
          <li class="action-item align-action material-symbols-outlined"
            :class="{selected: node.attrs.align === 'left'}"
            @click="alignHandler('left')"
            title="左对齐"
          >align_horizontal_left</li>
          <li class="action-item align-action material-symbols-outlined"
            :class="{selected: node.attrs.align === 'center'}"
            @click="alignHandler('center')"
            title="居中对齐"
          >align_horizontal_center</li>
          <li class="action-item align-action material-symbols-outlined"
            :class="{selected: node.attrs.align === 'right'}"
            @click="alignHandler('right')"
            title="右对齐"
          >align_horizontal_right</li>
          <li class="action-item link-action material-symbols-outlined"
            v-if="!node.attrs.href"
            title="链接"
            @click="linkInputVisible=true"
          >add_link</li>
          <li class="action-item link-action material-symbols-outlined"
            :class="{selected: !!node.attrs.href}"
            title="修改链接"
            v-else
            @click="linkInputVisible=true"
          >link</li>
          <li class="action-item link-action material-symbols-outlined"
            v-if="node.attrs.href"
            title="取消链接"
            @click="hrefHandler(null)"
          >link_off</li>
          <li class="action-item size-action" title="调整大小"><ElSlider :model-value="node.attrs.size" :min="10" :max="100" @update:model-value="sizeChangeHandler"></ElSlider></li>
          <li></li>
        </ul>
        <LinkInput :href="node.attrs.href" v-else @change="hrefHandler($event.href)" @clear="hrefHandler(null)"></LinkInput>
      </template>
    </el-tooltip>
    <figcaption data-prosemirror-content-dom class="editor-image-node-title"></figcaption>
  </figure>
</template>

<script lang="ts" setup>
import { ElTooltip, ElSlider } from 'element-plus';
import type { VueNodeViewProps } from '../plugins/vueNodeViews';
import LinkInput from '../components/LinkInput.vue';
import type { Attrs } from 'prosemirror-model';
import { computed, inject, onMounted, ref } from 'vue';
import { getImageSize, selectFile } from '../utils';
import { uploadSymbol } from '../const';

const props = defineProps<VueNodeViewProps>()
const emits = defineEmits<{
  updateAttrs: [Attrs]
}>()

const upload = inject<(file: Blob | File) => Promise<string>>(uploadSymbol)

const containerEl = ref<HTMLElement>()
const maxWidth = ref(200)
const linkInputVisible = ref(false)

const editable = computed(() => props.view?.editable)

onMounted(() => {
  maxWidth.value = containerEl.value!.parentElement!.getBoundingClientRect().width
})

const sizeChangeHandler = (size: any) => {
  emits('updateAttrs', { size })
}

const alignHandler = (align: 'left' | 'center' | 'right') => {
  emits('updateAttrs', { align })
}

const hrefHandler = (href: string | null) => {
  emits('updateAttrs', { href })
  linkInputVisible.value = false
}

const selectImage = async () => {
  const image = await selectFile('image/*')
  const url = URL.createObjectURL(image)
  const size = await getImageSize(url)
  console.log(upload)
  emits('updateAttrs', { ratio: `${size.width}/${size.height}`, src: url })
  upload && emits('updateAttrs', { src: await upload(image) })
}

</script>

<style lang="less" scoped>
.editor-image-node {
  width: fit-content;
  margin: 0;
  position: relative;
  transition: width .1s;
  &.align-center {
    margin: 0 auto;
  }
  &.align-right {
    margin-left: auto;
  }
  .resizer {
    height: auto !important;
    &::v-deep(.resizer-border) {
      background: green;
    }
  }
  img.editor-image-node-image {
    width: 100%;
    vertical-align: top;
    min-width: 100px;
    min-height: 10px;
  }
  figcaption.editor-image-node-title {
    text-align: center;
  }
}
.action-list {
  display: flex;
  align-items: center;
  margin: 0;
  padding: 0;
  list-style: none;
  gap: 10px;
  .action-item.align-action, .action-item.link-action, .action-item.replace-action {
    cursor: pointer;
    transition: background .2s;
    font-size: 18px;
    padding: 3px;
    border-radius: 4px;
    &.selected {
      background: rgb(198, 198, 198);
    }
    &:hover {
      background: gainsboro;
    }
  }
  .action-item.size-action {
    width: 200px;
    margin-left: 10px;
  }
}
</style>
