<template>
  <figure class="editor-base-image"
    tabindex="0"
    :class="'align-' + node.attrs.align"
    ref="containerEl"
    :style="{
      width: node.attrs.width + 'px',
      marginLeft: node.attrs.align === 'left' ? '0' : 'auto',
      marginRight: node.attrs.align === 'right' ? '0' : 'auto'
    }">
    <component class="image-wrapper" :is="node.attrs.href ? 'a' : 'div'"
      :href="editable ? 'javascript:void(0)' : node.attrs.href || undefined"
      :style="{ aspectRatio: node.attrs.ratio }">
      <img
        ref="imgEl"
        draggable="false"
        class="editor-base-image-image"
        :src="node.attrs.src || 'https://fakeimg.pl/200'"
        alt=""
      >
      <div class="width-resizer left-resizer"
        @pointerdown.capture.prevent.stop="pointerdownHandler('left', $event)"
        @pointerup.capture.prevent.stop="pointerupHandler('left', $event)"
        @pointermove.capture.prevent.stop="pointermoveHandler('left', $event)"
        v-if="editable"
      ></div>
      <div class="width-resizer right-reiser"
        @pointerdown.capture.prevent.stop="pointerdownHandler('right', $event)"
        @pointerup.capture.prevent.stop="pointerupHandler('right', $event)"
        @pointermove.capture.prevent.stop="pointermoveHandler('right', $event)"
        v-if="editable"
      ></div>
      <ul class="action-list">
        <slot name="menu"></slot>
        <template v-if="editable">
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
          <el-tooltip
            trigger="click"
            effect="light"
            :trigger-keys="[]"
            width="fit-content">
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
            <template #content>
              <LinkInput :href="node.attrs.href" @change="hrefHandler($event.href)" @clear="hrefHandler(null)"></LinkInput>
            </template>
          </el-tooltip>
          <li class="action-item link-action material-symbols-outlined"
            v-if="node.attrs.href"
            title="取消链接"
            @click="hrefHandler(null)"
          >link_off</li>
        </template>
      </ul>
    </component>
    <figcaption data-prosemirror-content-dom class="editor-base-image-title"></figcaption>
  </figure>
</template>

<script lang="ts" setup>
import { ElTooltip } from 'element-plus';
import type { VueNodeViewProps } from '../../plugins/vueNodeViews';
import LinkInput from '../../components/LinkInput.vue';
import type { Attrs } from 'prosemirror-model';
import { computed, ref } from 'vue';

const props = defineProps<VueNodeViewProps>()
const emits = defineEmits<{
  updateAttrs: [Attrs],
}>()

const containerEl = ref<HTMLElement>()
const imgEl = ref<HTMLImageElement>()
const linkInputVisible = ref(false)

const editable = computed(() => props.view?.editable)

const alignHandler = (align: 'left' | 'center' | 'right') => {
  emits('updateAttrs', { align })
}

const hrefHandler = (href: string | null) => {
  emits('updateAttrs', { href })
  linkInputVisible.value = false
}

let startX = 0
let imageWidth = 0
const pointerdownHandler = (drt: 'left' | 'right', event: PointerEvent) => {
  startX = event.clientX;
  imageWidth = imgEl.value!.getBoundingClientRect().width;
  (event.target as HTMLDivElement).setPointerCapture(event.pointerId)
}

const getMaxWidth = () => containerEl.value!.parentElement!.getBoundingClientRect().width

const calcTargetWidth = (drt: 'left' | 'right', curX: number) => {
  let offset = drt === 'right' ? curX - startX : startX - curX
  offset = props.node.attrs.align === 'center' ? 2 * offset : offset
  return Math.max(Math.min(getMaxWidth(), (imageWidth + offset)), 60)
}

const pointermoveHandler = (drt: 'left' | 'right', event: PointerEvent) => {
  if (event.buttons !== 1) return;
  containerEl.value!.style.width = calcTargetWidth(drt, event.clientX) + 'px'
}

const pointerupHandler = (drt: 'left' | 'right', event: PointerEvent) => {
  (event.target as HTMLDivElement).releasePointerCapture(event.pointerId);
  emits('updateAttrs', { width: calcTargetWidth(drt, event.clientX) })
}

</script>

<style lang="less" scoped>
.editor-base-image {
  width: fit-content;
  margin: 0;
  position: relative;
  &:focus-within .width-resizer {
    opacity: 1;
  }
  &.align-center {
    margin: 0 auto;
  }
  &.align-right {
    margin-left: auto;
  }
  img.editor-base-image-image {
    width: 100%;
    vertical-align: top;
    min-height: 60px;
    min-width: 60px;
  }
  figcaption.editor-base-image-title {
    text-align: center;
  }
}
.image-wrapper {
  display: block;
  position: relative;
  border: 1px solid rgba(0, 0, 0, .1);
}
.width-resizer {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 50%;
  min-height: 60px;
  width: 6px;
  border-radius: 9999px;
  box-shadow: 0 2px 6px #666;
  background-color: #333;
  cursor: ew-resize;
  opacity: 0;
  transition: opacity .6s;
  &:hover {
    opacity: 1;
  }
}
.width-resizer.left-resizer {
  right: unset;
  left: 0;
}
.action-list {
  position: absolute;
  right: 8px;
  top: 8px;
  display: flex;
  align-items: center;
  margin: 0;
  padding: 2px 4px;
  list-style: none;
  gap: 10px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  border-radius: 2px;
  &:empty {
    display: none;
  }
  &:deep( > *) {
    cursor: pointer;
  }
  &:deep(*::selection) {
    background: none;
  }
  .action-item {
    font-size: 18px;
    width: 22px;
    cursor: pointer;
    text-align: center;
    transition: background .2s;
    padding: 3px;
    border-radius: 2px;
    &.selected {
      background: rgba(0, 0, 0, 0.7);
    }
    &:hover {
      color: #fff;
      background: rgba(0, 0, 0, 0.4);
    }
    &:active {
      background: rgba(0, 0, 0, 0.6);
    }
  }
}
</style>
