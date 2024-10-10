<template>
  <base-image class="image-view"
    data-prosemirror-dom
    v-bind="props"
    @update-attrs="$emit('updateAttrs', $event)"
  >   
    <template #menu v-if="editable">
      <li class="action-item" style="display:flex;align-items:center;" v-if="loading">
        <img src="https://api.iconify.design/line-md:loading-loop.svg?color=%23ffffff&width=20&height=20" alt="">
      </li>
      <li class="action-item material-symbols-outlined"
        @click="selectImage"
        title="替换图片"
      >image</li>
      <li class="action-item material-symbols-outlined"
        title="删除"
        @click="remove"
      >
        delete
      </li>
    </template>
  </base-image>
</template>

<script lang="ts" setup>
import type { VueNodeViewProps } from '../plugins/vueNodeViews';
import BaseImage from './components/BaseImage.vue';
import type { Attrs } from 'prosemirror-model';
import { computed, inject, onMounted, ref } from 'vue';
import { getImageSize, selectFile } from '../utils';
import { uploadSymbol } from '../const';
import { ElMessageBox } from 'element-plus';

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
  const tr = props.view!.state.tr
  const pos = props.getPos!()
  tr.setNodeAttribute(pos, 'ratio', `${size.width}/${size.height}`)
  tr.setNodeAttribute(pos, 'src', url)
  const content = props.node.type.contentMatch.defaultType?.createAndFill(null, props.view!.state.schema.text(image.name.split('.')[0]))
  if (content) {
    // pos |(+1) image | (+2) plain_text
    const $pos = tr.doc.resolve(pos + 2)
    tr.replaceRangeWith($pos.before(), $pos.after(), content)
  }
  tr.scrollIntoView()
  props.view?.dispatch(tr)

  if (upload) {
    emits('updateAttrs', { src: await upload(image, { previous: props.node.attrs.src }) })
  }
  loading.value = false
}

const remove = async () => {
  if (!props.view || !props.getPos) return
  await ElMessageBox.confirm('确认删除？')
  const from = props.getPos()
  const tr = props.view.state.tr
  const $pos = props.view.state.doc.resolve(from + 1)
  props.view.dispatch(tr.deleteRange($pos.before(), $pos.after()))
}

onMounted(() => {
  if (editable.value && !props.node.attrs.src && props.view && props.getPos) {
    selectImage().catch(err => {
      const from = props.getPos!()
      console.log(from)
      props.view!.dispatch(props.view!.state.tr.delete(from, from + 1))
      throw err
    })
  }
})

</script>
