<template>
  <figure data-prosemirror-dom class="editor-image-node"
    :class="'align-' + node.attrs.align"
    ref="containerEl"
    :style="{
      width: node.attrs.size + '%',
      marginLeft: node.attrs.align === 'left' ? '0' : 'auto',
      marginRight: node.attrs.align === 'right' ? '0' : 'auto'
    }">
    <el-popover placement="top" trigger="click" width="fit-content" @after-leave="linkInputVisible = false">
      <template #reference>
        <img
          draggable="false"
          class="editor-image-node-image"
          :src="node.attrs.src || 'https://fakeimg.pl/200'"
          alt=""
        >
      </template>
      <template #default>
        <ul class="action-list" v-if="!linkInputVisible">
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
    </el-popover>
    <figcaption data-prosemirror-content-dom class="editor-image-node-title"></figcaption>
  </figure>
</template>

<script lang="ts" setup>
import { ElPopover, ElSlider } from 'element-plus';
import type { VueNodeViewProps } from '@/editor/plugins/vueNodeViews';
import LinkInput from '@/editor/components/LinkInput.vue';
import type { Attrs } from 'prosemirror-model';
import { onMounted, ref } from 'vue';

const props = defineProps<VueNodeViewProps>()
const emits = defineEmits<{
  updateAttrs: [Attrs]
}>()

const containerEl = ref<HTMLElement>()
const maxWidth = ref(200)
const linkInputVisible = ref(false)

onMounted(() => {
  maxWidth.value = containerEl.value!.parentElement!.getBoundingClientRect().width
})

const sizeChangeHandler = (size: any) => {
  emits('updateAttrs', { ...props.node.attrs, size })
}

const alignHandler = (align: 'left' | 'center' | 'right') => {
  emits('updateAttrs', { ...props.node.attrs, align })
}

const hrefHandler = (href: string | null) => {
  emits('updateAttrs', { ...props.node.attrs, href })
  linkInputVisible.value = false
}

</script>

<style lang="less" scoped>
.editor-image-node {
  width: fit-content;
  margin: 0;
  position: relative;
  user-select: none;
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
  .action-item.align-action, .action-item.link-action {
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
  }
}
</style>
