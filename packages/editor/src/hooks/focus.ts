import { moveCaretToEnd, moveCaretToStart } from '../models/caret';
import { createLogger } from '@writing/utils/logger';
import { nextTick, onBeforeUnmount, onMounted } from 'vue';

const logger = createLogger('focus');

let focusedEl: HTMLElement | null = null;

export const focusBefore = () => {
  logger.i('focusBefore');
  const doms = Array.from(document.querySelectorAll<HTMLElement>('[data-focusable]'));
  const index = (focusedEl && doms.indexOf(focusedEl)) ?? -1;
  if (doms[0] && (!focusedEl || index === -1)) {
    doms[0].focus();
  } else if (index > 0) {
    doms[index - 1].focus();
  }
};

export const focusAfter = () => {
  logger.i('focusAfter');
  const doms = Array.from(document.querySelectorAll<HTMLElement>('[data-focusable]'));
  const index = (focusedEl && doms.indexOf(focusedEl)) ?? -1;
  if (doms[0] && !focusedEl) {
    doms[0].focus();
  } else if (doms[index + 1]) {
    doms[index + 1].focus();
  }
};

const focusBlockImmediate = (id: string, pos: 'start' | 'end') => {
  const input: HTMLDivElement | null | undefined = document.body.querySelector<HTMLDivElement>(`[data-block-id=${JSON.stringify(id)}] [data-focusable]`);
  input?.focus();
  logger.w('focusBlockImmediate', input, id);
  if (input) {
    pos === 'end' && moveCaretToEnd(input);
    pos === 'start' && moveCaretToStart(input);
  }
};

export const focusBlock = (id: string, pos: 'start' | 'end' = 'end') => {
  logger.i('focusBlock', id, pos);
  setTimeout(() => {
    nextTick(() => {
      focusBlockImmediate(id, pos);
    });
  });
};

export const useFocusEvent = () => {
  const focusHandler = (event: FocusEvent) => {
    focusedEl = (event.target as HTMLElement);
  };

  onMounted(() => {
    window.addEventListener('focusin', focusHandler);
  });
  onBeforeUnmount(() => {
    window.removeEventListener('focusin', focusHandler);
  });
};
