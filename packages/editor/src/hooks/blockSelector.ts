import { Mode } from '../components/schema';
import { ref, type ComputedRef, type Ref } from 'vue';
import BlockSelectorVue from '../components/tool/BlockSelector.vue';
import { createLogger } from '@writing/utils/logger';

const logger = createLogger('blockSelector');

export const useBlockSelectorOnPointermove = (options: { el: Ref<HTMLElement | undefined>, mode: ComputedRef<Mode> }) => {
  const state = ref({
    top: 0, left: 0,
    visible: false
  });
  const hide = () => { state.value.visible = false; };

  const pointermoveHandler = (event: PointerEvent) => {
    if (options.mode.value === Mode.Readonly) {
      return hide();
    }
    let blockEl = document.elementFromPoint(event.clientX + 18, event.clientY).closest<HTMLElement>('[data-block-id');
    if (!blockEl) {
      blockEl = (event.target as HTMLElement).closest('[data-block-id]');
    }
    if (!blockEl) return hide();
    const blockContentEl = blockEl.querySelector<HTMLDivElement>('.block-content');
    if (!blockContentEl) return hide();
    const { left } = blockEl.getBoundingClientRect();
    const { top, height } = blockContentEl.getBoundingClientRect();
    const { top: pTop, left: pLeft } = options.el.value!.getBoundingClientRect();
    const tTop = top - pTop + (height - 24) / 2;
    const tLeft = left - pLeft - 28;
    state.value = {
      top: tTop,
      left: tLeft,
      visible: true
    };
  };
  return { state, pointermoveHandler };
};

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