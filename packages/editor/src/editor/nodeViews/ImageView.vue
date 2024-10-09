<template>
  <base-image class="image-view"
    data-prosemirror-dom
    v-bind="props"
    @update-attrs="$emit('updateAttrs', $event)"
  >
    <template #menu>
      <li class="action-item" style="display:flex;align-items:center;" v-if="loading">
        <img src="https://api.iconify.design/line-md:loading-loop.svg?color=%23ffffff&width=20&height=20" alt="">
      </li>
      <li class="action-item material-symbols-outlined"
        @click="selectImage"
        title="替换图片"
      >image</li>
    </template>
  </base-image>
</template>

<script lang="ts" setup>
import type { VueNodeViewProps } from '../plugins/vueNodeViews';
import BaseImage from './components/BaseImage.vue';
import type { Attrs } from 'prosemirror-model';
import { computed, inject, ref } from 'vue';
import { getImageSize, selectFile } from '../utils';
import { uploadSymbol } from '../const';

const props = defineProps<VueNodeViewProps>()
const emits = defineEmits<{
  updateAttrs: [Attrs]
}>()

const upload = inject<(file: File, options?: { previous: string }) => Promise<string>>(uploadSymbol)

const editable = computed(() => props.view?.editable)
const loading = ref(false)

const selectImage = async () => {
  const image = await selectFile('image/*')
  loading.value = true
  const url = URL.createObjectURL(image)
  const size = await getImageSize(url)
  emits('updateAttrs', { ratio: `${size.width}/${size.height}`, src: url })
  if (upload) {
    emits('updateAttrs', { src: await upload(image, { previous: props.node.attrs.src }) })
  }
  loading.value = false
}

</script>
