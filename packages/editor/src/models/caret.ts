import { createLogger } from '@writing/utils/logger';

const logger = createLogger('caret');

export const moveCaret = (element: HTMLElement, offset: number) => {
  logger.i('moveCaret', element, offset);
  if (offset === 0) {
    return moveCaretToStart(element);
  }
  const nodeIterator = document.createNodeIterator(element, NodeFilter.SHOW_TEXT);

  let focusNode: Node | null = null;
  let lastNode: Node | null = null;
  while(!focusNode && nodeIterator.nextNode()) {
    lastNode = nodeIterator.referenceNode;
    if ((nodeIterator.referenceNode.nodeValue?.length ?? 0) >= offset) {
      focusNode = nodeIterator.referenceNode;
    } else {
      offset -= (nodeIterator.referenceNode.nodeValue?.length ?? 0);
    }
  }
  if (!focusNode) {
    focusNode = lastNode || element;
    offset = focusNode?.nodeValue?.length ?? 0;
  }
  logger.i('focusNode', focusNode, offset);
  const selection = window.getSelection();
  selection?.setPosition(focusNode, offset);
};

export const moveCaretToEnd = (element: HTMLElement) => {
  logger.i('moveCaretToEnd', element);
  moveCaret(element, element.textContent?.length ?? 0);
};

export const moveCaretToStart = (element: HTMLElement) => {
  logger.i('moveCaretToStart', element);
  const selection = window.getSelection()!;
  selection.setPosition(element, 0);
};

export const getCaretOffset = (element: HTMLElement) => {
  logger.i('getCaretPosition', element);
  const selection = window.getSelection();
  if (!selection || !element.contains(selection.anchorNode) || selection.anchorNode?.nodeType !== Node.TEXT_NODE) return 0;

  const iterator = document.createNodeIterator(element, NodeFilter.SHOW_TEXT);
  
  let offset = 0;
  while(iterator.nextNode() !== selection.anchorNode) {
    offset += (iterator.referenceNode.nodeValue?.length ?? 0);
  }
  offset += selection.anchorOffset;
  logger.i('getCaretPosition offset', offset);
  return offset;
};

export const getSelectionOffset = (element: HTMLElement, node: Node) => {
  if (!element.contains(node) || node?.nodeType !== Node.TEXT_NODE) return 0;

  const iterator = document.createNodeIterator(element, NodeFilter.SHOW_TEXT);
  
  let offset = 0;
  while(iterator.nextNode() !== node) {
    offset += (iterator.referenceNode.nodeValue?.length ?? 0);
  }
  logger.i('getSelectionPosition offset', offset);
  return offset;
};
