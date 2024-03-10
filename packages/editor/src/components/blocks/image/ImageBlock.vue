<template>
  <div class="image-block">
    <focusable-control
      class="upload-tip"
      @click="uploadFile"
      v-if="!data.src"
      :disabled="readonly"
      @keydown.enter="uploadFile"
      @keydown.delete.prevent="$emit('remove')">
      <span class="material-symbols-outlined upload-icon">
      image
      </span>
      <span class="no-focus">
        点击上传图片
      </span>
      <span class="focused">
        回车或点击上传图片
      </span>
    </focusable-control>
    <base-image :model-value="data"
      @update:model-value="update"
      @remove="$emit('remove')"
      @add="$emit('add', $event)"
      v-else>
      <template v-slot:menu-item-list>
        <span class="material-symbols-outlined settings-icon upload-icon"
          title="更换图片"
          @click="uploadFile">
          image
        </span>
      </template>
    </base-image>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { createBlock, type BlockModel } from '../../../models/block';
import BaseImage from '../BaseImage.vue';
import FocusableControl from '../../FocusableControl.vue';
import { ImageAlign } from '../../schema';
import { useMode } from '../../../hooks/mode';
import type { ImageData } from '../../schema';
import { useUpload } from '../../../hooks/upload';

const block = defineModel<BlockModel>({ required: true });

const { readonly } = useMode();

defineEmits<{
  remove: [],
  add: [options?: Partial<BlockModel>]
}>();

const { uploadImageFile } = useUpload();

const data = ref<ImageData>({
  src: block.value.data?.src ?? '',
  align: block.value.data?.align ?? ImageAlign.Center,
  size: block.value.data?.size ?? 50,
  title: block.value.data?.title ?? createBlock({ type: 'text', data: { html: '图片描述' } }),
  ratio: block.value.data?.ratio ?? 1,
});

watch(block, () => {
  data.value = {
    src: block.value.data?.src ?? '',
    align: block.value.data?.align ?? ImageAlign.Center,
    size: block.value.data?.size ?? 50,
    title: block.value.data?.title ?? createBlock({ type: 'text', data: { html: '图片描述' } }),
    ratio: block.value.data?.ratio ?? 1,
  };
});

const update = (newData: Partial<ImageData>) => {
  data.value = {
    ...data.value,
    ...newData
  };
  block.value = {
    ...block.value,
    data: data.value
  };
};

const uploadFile = async () => {
  const { url, ratio } = await uploadImageFile();
  update({ src: url, ratio });
};

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

.image-container {
  &.Center .image-wrapper {
    margin-left: auto;
    margin-right: auto;
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
    margin: 12px 0;
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
    .settings-icon {
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