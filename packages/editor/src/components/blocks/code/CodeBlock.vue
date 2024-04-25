<template>
  <div class="code-block">
    <div class="code-mirror-container">
      <el-select :model-value="data.language"
        filterable
        clearable
        @update:model-value="update({ language: $event })"
        class="language-selector"
        size="small"
        @change="languageChangeHandler">
        <el-option v-for="language in languages"
          :value="language.name"
          :key="language.name">{{ language.name }}</el-option>
      </el-select>
      <div class="code-mirror-wrapper" ref="codeMirrorWrapper" tabindex="0" @keydown.capture="keydownHandler"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ElSelect, ElOption } from 'element-plus';
import { useMode } from '../../../hooks/mode';
import type { BlockModel } from '../../../models/block';
import { basicSetup, EditorView } from 'codemirror';
import { Compartment, EditorState } from '@codemirror/state';
import { LanguageDescription } from '@codemirror/language';
import { oneDark } from '@codemirror/theme-one-dark';
import { languages } from '@codemirror/language-data';
import { onBeforeUnmount, ref, onMounted, watch, markRaw } from 'vue';

const block = defineModel<BlockModel>({ required: true });

const emits = defineEmits<{
  add: [options?: Partial<BlockModel>],
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
  language?: string,
  text: string
}
const data = ref<CodeData>({
  language: block.value.data.language ?? '',
  text: block.value?.data?.text ?? ''
});

watch(() => block.value.data, (val) => {
  if (!val) return;
  if (val.text !== data.value.text) {
    viewer.dispatch({changes: {
      from: 0,
      to: viewer.state.doc.length,
      insert: val.text
    }});
  }
  if (val.language !== data.value.language) {
    languageChangeHandler(val.language);
  }
});

let viewer: EditorView | null = null;

const languageConfig = markRaw(new Compartment());

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

const languageChangeHandler = (value: string) => {
  if (!value) return viewer.dispatch({
    effects: languageConfig.reconfigure([])
  });
  const matched = LanguageDescription.matchLanguageName(languages, value);
  if (!matched) {
    return viewer.dispatch({
      effects: languageConfig.reconfigure([])
    });
  }
  matched.load().then(() => {
    viewer.dispatch({
      effects: languageConfig.reconfigure(matched.support)
    });
  });
  if (value !== matched.name || matched.name !== data.value.language) {
    update({ language: matched.name });
  }
};

onMounted(() => {
  viewer = markRaw(new EditorView({
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
      languageConfig.of([]),
      readonlyConfig.of(EditorView.editable.of(!readonly.value)),
      oneDark
    ],
  }));
  languageChangeHandler(data.value.language);
});

onBeforeUnmount(() => {
  viewer?.destroy();
  viewer = null;
  state = null;
});
</script>

<style lang="less" scoped>
.code-mirror-container {
  position: relative;
  .language-selector {
    position: absolute;
    right: 0;
    top: 12px;
    width: 160px;
    z-index: 1;
    opacity: 0;
    transition: opacity .3s;
    &:hover, &:focus-within {
      opacity: 1;
    }
  }
}
.code-block .code-mirror-wrapper {
  padding: 12px 0;
}
</style>