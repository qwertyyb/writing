<template>
  <div class="image-block">
    <div class="upload-tip" @click="upload" v-if="!src">
      <span class="material-symbols-outlined upload-icon">
      image
      </span>
      点击上传图片
    </div>
    <div class="image-container"
      :class="align"
      ref="containerEl"
      v-else>
      <figure class="image-wrapper" :style="{ width: size + '%'}">
        <img :src="src" alt="" class="image" ref="imageEl">
        <figcaption class="image-title">这里是标题这里是标题这里是标题</figcaption>
        <div class="image-settings-wrapper">
          <div class="image-settings">
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
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
        <div class="image-resizer">
          <div class="resizer-top"></div>
          <div class="resizer-bottom"></div>
          <div class="resizer-left"
            @pointerdown="pointerdownHandler('left', $event)"
            @pointermove="pointermoveHandler('left', $event)"
            @pointerup="pointerupHandler($event)"></div>
          <div class="resizer-right"
            @pointerdown="pointerdownHandler('right', $event)"
            @pointermove="pointermoveHandler('right', $event)"
            @pointerup="pointerupHandler($event)"></div>
        </div>
      </figure>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import type { BlockModel } from '@/models/block';
import TextRenderer from '../TextRenderer.vue';

const props = defineProps<{
  block: BlockModel,
}>()

const textRenderRef = ref<InstanceType<typeof TextRenderer>>()
const imageEl = ref<HTMLImageElement>()
const containerEl = ref<HTMLDivElement>()

enum ImageAlign {
  Left = 'Left',
  Center = 'Center',
  Right = 'Right'
}

const src = ref('')
const align = ref<ImageAlign>(ImageAlign.Center)
const size = ref<number>(50)

const upload = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.addEventListener('change', () => {
    const files = input.files
    if (!files?.length) return

    // @todo 先简单处理，生成blob，后续需要上传到server端
    const url = URL.createObjectURL(files[0])
    src.value = url
  })
  input.click()
}

const commandHandler = (command: string) => {
  switch (command) {
    case 'Align.Left':
      align.value = ImageAlign.Left
      break
    case 'Align.Right':
      align.value = ImageAlign.Right
      break
    case 'Align.Center':
      align.value = ImageAlign.Center
      break
    case 'Size.Large':
      size.value = Math.min(100, size.value + 25)
      break
    case 'Size.Small':
      size.value = Math.max(0, size.value - 25)
      break
  }
}

const startPos = { x: 0, y: 0, width: 0, height: 0 }
const pointerdownHandler = (direction: 'left' | 'right', event: PointerEvent) => {
  startPos.x = event.clientX;
  startPos.width = imageEl.value?.getBoundingClientRect().width ?? 0;
  (event.target as HTMLElement).setPointerCapture(event.pointerId)
}
const pointermoveHandler = (direction: 'left' | 'right', event: PointerEvent) => {
  if (event.buttons !== 1) return
  const pwidth = containerEl.value!.getBoundingClientRect().width
  let dwidth = direction === 'left' ? startPos.x - event.clientX : event.clientX - startPos.x
  if (align.value === ImageAlign.Center) {
    dwidth *= 2
  }
  size.value = Math.round((startPos.width + dwidth) / pwidth * 100)
}
const pointerupHandler = (event: PointerEvent) => {
  (event.target as HTMLElement).releasePointerCapture(event.pointerId)
}

defineExpose({
  save() {
    return {
      src: src.value,
      size: size.value,
      align: align.value
    }
  }
})
</script>

<style lang="less" scoped>
.upload-tip {
  display: flex;
  align-items: center;
  color: rgba(200, 200, 200, 1);
  .upload-icon {
    font-size: 36px;
  }
}

.image-container {
  &.Center .image-wrapper {
    margin: 0 auto;
  }
  &.Left .image-wrapper {
    margin-right: auto;
  }
  &.Right .image-wrapper {
    margin-left: auto;
  }
  .image-wrapper {
    position: relative;
    width: fit-content;
    transition: width .1s;
  }
  img {
    width: 100%;
    max-width: 100%;
    height: auto;
  }
  .image-title {
    text-align: center;
  }
  .image-resizer {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    @indicator-width: 6px;
    @indicator-space: 4px;
    @indicator-color: rgba(0, 0, 0, .2);
    .resizer-top, .resizer-bottom,
    .resizer-left, .resizer-right {
      border-radius: 9999px;
      background: @indicator-color;
    }
    .resizer-top, .resizer-bottom {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      width: 50%;
      height: @indicator-width;
      cursor: row-resize;
    }
    .resizer-left, .resizer-right {
      position: absolute;
      top: 50%;
      height: 50%;
      transform: translateY(-50%);
      width: @indicator-width;
      cursor: col-resize;
    }
    .resizer-top {
      top: -@indicator-width - @indicator-space;
    }
    .resizer-bottom {
      bottom: -@indicator-width - @indicator-space;
    }
    .resizer-left {
      left: -@indicator-width - @indicator-space;
    }
    .resizer-right {
      right: -@indicator-width - @indicator-space;
    }
  }
  .image-settings-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(64, 133, 164, 0.4);
    .image-settings {
      position: absolute;
      top: 6px;
      right: 6px;
    }
    .settings-icon {
      background: rgba(0, 0, 0, .2);
      font-size: 28px;
      border-radius: 6px;
      transition: background .2s;
      cursor: pointer;
      color: #fff;
      &:hover {
        background: rgba(0, 0, 0, .3);
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