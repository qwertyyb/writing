import { ref } from 'vue';
import BlockSelectorVue from '../components/tool/BlockSelector.vue';
import { createLogger } from '@writing/utils/logger';

const logger = createLogger('blockSelector');

export const useBlockSelectorState = () => {
  const state = ref<{
    rect: { top: number, left: number, width: number, height: number },
    visible: boolean,
    keyword: string,
    keywordOffset: number
  }>({
    rect: null, visible: false, keyword: '', keywordOffset: 0
  });
  const selector = ref<InstanceType<typeof BlockSelectorVue>>();

  const open = (rect: { top: number, left: number, width: number, height: number }, offset: number) => {
    state.value.keywordOffset = offset;
    state.value.rect = rect;
    state.value.keyword = '';
    state.value.visible = true;
  };

  const close = () => { state.value.visible = false; };

  const setKeyword = (keyword: string) => {
    logger.i('setKeyword', keyword);
    state.value.keyword = keyword.replace(/\n/g, '');
  };

  return { state, selector, open, close, setKeyword };
};