<template>
  <figure class="base-image"
    :class="data.align"
    ref="containerEl"
    :style="{ width: data.size + '%' }">
    <focusable-control tag="img"
      :src="uploadState.loading ? uploadState.tempUrl : data.src"
      alt=""
      class="image"
      ref="imageEl"
      :disabled="readonly"
      :style="{ aspectRatio: uploadState.loading ? uploadState.tempRatio : data.ratio }"
      @click="canEdit && (settingsVisible = true)"
      @keydown.enter="$emit('add')"
      @keydown.delete.prevent="$emit('remove')" />
    <figcaption class="image-title">
      <text-block
        :model-value="data.title"
        :index="0"
        @add="$emit('add', $event)"
        @update:modelValue="update({ 'title': $event })"
      ></text-block>
    </figcaption>


    <div class="image-upload-status" v-if="uploadState.loading">
      <span class="material-symbols-outlined loading-icon">
        progress_activity
      </span>
      <p class="upload-text">{{ uploadState.text }}</p>
    </div>

    <transition name="el-fade-in">
      <div class="image-settings-container" v-show="settingsVisible" v-click-outside="() => settingsVisible = false">
        <div class="image-resizer">
          <div class="resizer-left"
            @pointerdown="pointerdownHandler('left', $event)"
            @pointermove="pointermoveHandler('left', $event)"
            @pointerup="pointerupHandler($event)"></div>
          <div class="resizer-right"
            @pointerdown="pointerdownHandler('right', $event)"
            @pointermove="pointermoveHandler('right', $event)"
            @pointerup="pointerupHandler($event)"></div>
        </div>

        <div class="image-settings-wrapper">
          <div class="image-settings">
            <span class="material-symbols-outlined settings-icon delete-icon"
              title="删除"
              @click="$emit('remove')">
            delete
            </span>
            <slot name="menu-item-list"></slot>
            <el-dropdown popper-class="image-setting-menu-popper" @command="commandHandler">
              <span class="material-symbols-outlined settings-icon">more_horiz</span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="Align.Left">
                    <span class="material-symbols-outlined menu-item-icon">
                    format_image_left
                    </span>
                    左对齐
                  </el-dropdown-item>
                  <el-dropdown-item command="Align.Center">
                    <span class="material-symbols-outlined menu-item-icon">
                    format_align_center
                    </span>
                    居中对齐
                  </el-dropdown-item>
                  <el-dropdown-item command="Align.Right">
                    <span class="material-symbols-outlined menu-item-icon">
                    format_image_right
                    </span>
                    右对齐
                  </el-dropdown-item>
                  <el-dropdown-item divided command="Size.Large">
                    <span class="material-symbols-outlined menu-item-icon">
                    photo_size_select_large
                    </span>
                    放大
                  </el-dropdown-item>
                  <el-dropdown-item command="Size.Small">
                    <span class="material-symbols-outlined menu-item-icon">
                    photo_size_select_small
                    </span>
                    缩小
                  </el-dropdown-item>
                  <el-dropdown-item divided command="Remove">
                    <span class="material-symbols-outlined menu-item-icon">
                    delete
                    </span>
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>
    </transition>
  </figure>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import TextBlock from './TextBlock.vue';
import FocusableControl from '../FocusableControl.vue';
import { ImageAlign } from '../schema';
import { useMode } from '../../hooks/mode';
import type { ImageData } from '../schema';
import type { BlockModel } from '../../models/block';

const data = defineModel<ImageData>({ required: true })

const { readonly, canEdit } = useMode()

const emits = defineEmits<{
  remove: [],
  add: [options?: Partial<BlockModel>]
}>()

const imageEl = ref<InstanceType<typeof FocusableControl>>()
const containerEl = ref<HTMLDivElement>()
const settingsVisible = ref(false)

const uploadState = ref({
  loading: false,
  text: '',
  tempUrl: '',
  tempRatio: 1,
})

const update = (newData: Partial<ImageData>) => {
  data.value = {
    ...data.value,
    ...newData
  }
}

const commandHandler = (command: string) => {
  switch (command) {
    case 'Align.Left':
      update({ align: ImageAlign.Left })
      break
    case 'Align.Right':
      update({ align: ImageAlign.Right })
      break
    case 'Align.Center':
      update({ align: ImageAlign.Center })
      break
    case 'Size.Large':
      update({ size: Math.min(100, data.value.size + 25) })
      break
    case 'Size.Small':
      update({ size: Math.max(0, data.value.size - 25) })
      break
    case 'Remove': 
      emits('remove')
  }
}

const startPos = { x: 0, y: 0, width: 0, height: 0 }
const pointerdownHandler = (direction: 'left' | 'right', event: PointerEvent) => {
  startPos.x = event.clientX;
  startPos.width = imageEl.value?.$el.getBoundingClientRect().width ?? 0;
  (event.target as HTMLElement).setPointerCapture(event.pointerId)
}
const pointermoveHandler = (direction: 'left' | 'right', event: PointerEvent) => {
  if (event.buttons !== 1) return
  const pwidth = containerEl.value!.getBoundingClientRect().width
  let dwidth = direction === 'left' ? startPos.x - event.clientX : event.clientX - startPos.x
  if (data.value.align === ImageAlign.Center) {
    dwidth *= 2
  }
  update({ 'size': Math.round((startPos.width + dwidth) / pwidth * 100) })
}
const pointerupHandler = (event: PointerEvent) => {
  (event.target as HTMLElement).releasePointerCapture(event.pointerId)
}
</script>

<style lang="less" scoped>
.upload-tip {
  display: flex;
  align-items: center;
  color: rgba(200, 200, 200, 1);
  outline: none;
  .focused {
    display: none;
  }
  .upload-icon {
    font-size: 36px;
  }
  &:focus .focused {
    display: block;
  }
  &:focus .no-focus {
    display: none;
  }
}

.base-image {
  position: relative;
  width: fit-content;
  transition: width .1s;
  margin: 12px 0;
  &.Center {
    margin-left: auto;
    margin-right: auto;
  }
  &.Left {
    margin-right: auto;
  }
  &.Right {
    margin-left: auto;
  }
  .image {
    width: 100%;
    max-width: 100%;
    height: auto;
    background: rgba(5, 93, 117, 0.3)
  }
  .image-title {
    text-align: center;
  }
  .image-upload-status {
    position: absolute;
    left: 6px;
    top: 6px;
    display: flex;
    align-items: center;
    .loading-icon {
      animation: rotate 1s infinite both;
      color: rgba(0, 0, 0, .7);
      transform-origin: center center;
      display: block;
      font-size: 20px;
      width: fit-content;
      height: fit-content;
    }
    .upload-text {
      font-size: 12px;
      padding: 0;
      margin: 0;
      margin-left: 6px;
      color: #f00;
    }
  }

  .full-size() {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
  .image-resizer {
    .full-size();
    @indicator-width: 6px;
    @indicator-space: 4px;
    @indicator-color: rgba(0, 0, 0, .2);
    .resizer-left, .resizer-right {
      border-radius: 9999px;
      background: @indicator-color;
      pointer-events: auto;
    }
    .resizer-left, .resizer-right {
      position: absolute;
      top: 50%;
      height: 50%;
      transform: translateY(-50%);
      width: @indicator-width;
      cursor: col-resize;
    }
    .resizer-left {
      left: -@indicator-width - @indicator-space;
    }
    .resizer-right {
      right: -@indicator-width - @indicator-space;
    }
  }
  .image-settings-container {
    .full-size();
    pointer-events: none;
  }
  .image-settings-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(64, 133, 164, 0.4);
    @keyframes rotate {
      from { transform: rotate(0) }
      to { transform: rotate(360deg);}
    }
    .image-settings {
      position: absolute;
      top: 6px;
      right: 6px;
      pointer-events: auto;
      display: flex;
      border-radius: 4px;
      overflow: hidden;
    }
    .replace-tip {
      color: rgba(0, 0, 0, .6);
      font-size: 14px;
      height: 28px;
      line-height: 28px;
      margin-right: 6px;
      pointer-events: none;
    }
    &:deep(.settings-icon) {
      background: rgba(0, 0, 0, .2);
      font-size: 28px;
      width: 28px;
      height: 28px;
      display: flex;
      justify-content: center;
      align-items: center;
      transition: background .2s;
      cursor: pointer;
      color: #fff;
      outline: none;
      overflow: hidden;
      &:hover {
        background: rgba(0, 0, 0, .4);
      }
      &.delete-icon {
        border-top-left-radius: 4px;
        border-bottom-left-radius: 4px;
      }
      &.upload-icon, &.delete-icon {
        font-size: 18px;
      }
    }
  }
}
</style>
<style lang="less">
.image-setting-menu-popper {
  .menu-item-icon {
    font-size: 18px;
    font-weight: 400;
    margin-right: 6px;
  }
}
</style>