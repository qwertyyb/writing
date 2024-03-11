<template>
  <div class="code-block">
    <div class="code-mirror-container">
      <div class="code-mirror-wrapper" ref="codeMirrorWrapper" tabindex="0" @keydown.capture="keydownHandler"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useMode } from '../../../hooks/mode';
import type { BlockModel, BlockOptions } from '../../../models/block';
import { basicSetup, EditorView } from 'codemirror';
import { Compartment, EditorState } from '@codemirror/state';
import { onBeforeUnmount, ref, onMounted, watch } from 'vue';

const block = defineModel<BlockModel>({ required: true });

const emits = defineEmits<{
  add: [options?: Partial<BlockOptions>],
  focusBefore: [],
  focusAfter: [],
}>();

const codeMirrorWrapper = ref<HTMLDivElement>();

const { readonly } = useMode();

let readonlyConfig = new Compartment;

watch(readonly, () => {
  viewer?.dispatch({
    effects: readonlyConfig.reconfigure(EditorView.editable.of(!readonly.value))
  });
});

interface CodeData {
  text: string
}
const data = ref<CodeData>({
  text: block.value?.data?.text ?? ''
});

let viewer: EditorView | null = null;

const update = (newData: Partial<CodeData>) => {
  data.value = {
    ...data.value,
    ...newData
  };
  block.value = {
    ...block.value,
    data: data.value
  };
};

let state: EditorState | null = null;

const keydownHandler = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && data.value.text.endsWith('\n\n')) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    emits('add');
    viewer?.dispatch({changes: {
      from: 0,
      to: data.value.text.length,
      insert: data.value.text.replace(/\n\n$/, '')
    }});
  } else if (event.key === 'ArrowUp' && state?.selection.main.from === 0 && state.selection.main.to === 0) {
    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();
    emits('focusBefore');
  } else if (event.key === 'ArrowDown' && state?.selection.main.from === data.value.text.length && state.selection.main.to === data.value.text.length) {
    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();
    emits('focusAfter');
  }
};

onMounted(() => {
  console.log('data.value.text', data.value.text, typeof data.value.text);
  viewer = new EditorView({
    doc: data.value.text || '',
    parent: codeMirrorWrapper.value,  
    extensions: [
      basicSetup,
      EditorView.contentAttributes.of({ 'data-focusable': 'true' }),
      EditorView.updateListener.of(event => {
        state = event.state;
        const newText = event.state.doc.toString();
        if (newText !== data.value.text) {
          update({ text: newText });
        }
      }),
      readonlyConfig.of(EditorView.editable.of(!readonly.value))
    ],
  });
});

onBeforeUnmount(() => {
  viewer?.destroy();
  viewer = null;
  state = null;
});
</script>

<style lang="less" scoped>
.code-block .code-mirror-wrapper {
  padding: 12px 0;
}
</style>