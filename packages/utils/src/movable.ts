import { createLogger } from './logger';

const logger = createLogger('movable');

interface MovableOptions {
  movableSelector: string
  targetContentSelector: string
  handleSelector?: string
  targetClassName: string
  willInsertBeforeClassName: string
  willInsertAfterClassName: string
  willInsertChildrenClassName: string
  sourceClassName: string,
  clonedClassName: string,
  getSourceEl?: (event: PointerEvent) => HTMLElement
}

export const useMovable = (callback: (params: { source: HTMLElement, target: HTMLElement, position: 'before' | 'after' | 'inside' }) => void, {
  movableSelector = '.doc-tree-node',
  targetContentSelector = '.tree-node-content',
  targetClassName = 'movable-selected',
  willInsertBeforeClassName = 'movable-insert-before',
  willInsertAfterClassName = 'movable-insert-after',
  willInsertChildrenClassName = 'movable-insert-children',
  clonedClassName = 'movable-cloned',
  sourceClassName = 'movable-source',
  getSourceEl = null,
}: Partial<MovableOptions> = {
  movableSelector: '.doc-tree-node',
  targetContentSelector: '.tree-node-content',
  targetClassName: 'movable-selected',
  willInsertBeforeClassName: 'movable-insert-before',
  willInsertAfterClassName: 'movable-insert-after',
  willInsertChildrenClassName: 'movable-insert-children',
  clonedClassName: 'movable-cloned',
  sourceClassName: 'movable-source',
}) => {
  const getTreeNodeEl = (event: PointerEvent) => {
    if (typeof getSourceEl === 'function') {
      return getSourceEl(event);
    }
    const element = event.target as HTMLElement;
    if (element?.classList.contains(movableSelector)) return element;
    return element.closest<HTMLElement>(movableSelector);
  };

  let cloned: HTMLElement | null = null;
  let source: HTMLElement | null = null;
  let dragging = false;
  let dragStartTimeout: ReturnType<typeof setTimeout>;
  const clear = () => {
    Array.from(document.getElementsByClassName(targetClassName))
      .forEach(d => d.classList
        .remove(targetClassName, willInsertBeforeClassName, willInsertAfterClassName, willInsertChildrenClassName)
      );
    Array.from(document.getElementsByClassName(sourceClassName)).forEach(d => d.classList.remove(sourceClassName));
    cloned?.parentElement?.removeChild(cloned);
    cloned = null;
    source = null;
    dragging = false;
  };

  const pointerdownHandler = (event: PointerEvent) => {
    if (event.buttons !== 1) return;
    dragStartTimeout = setTimeout(() => {
      const treeNodeEl = getTreeNodeEl(event);
      if (!treeNodeEl) return;
      treeNodeEl.setPointerCapture(event.pointerId);
      source = treeNodeEl;
      cloned = treeNodeEl.cloneNode(true) as HTMLElement;
      cloned.classList.add(clonedClassName);
      cloned.style.height = treeNodeEl.clientHeight + 'px';
      cloned.style.width = treeNodeEl.clientWidth + 'px';
      const rect = treeNodeEl.offsetParent!.getBoundingClientRect();
      cloned.style.position = 'absolute';
      cloned.style.left = (event.clientX - rect.left + 10) + 'px';
      cloned.style.top = (event.clientY - rect.top + 10) + 'px';
      treeNodeEl.parentElement!.appendChild(cloned);
      treeNodeEl.classList.add(sourceClassName);
      dragging = true;
    }, 200);
  };
  
  const pointermoveHandler = (event: PointerEvent) => {
    if (event.buttons !== 1 || !cloned || !dragging) return;
    event.preventDefault();
    const rect = (event.target as HTMLElement).offsetParent!.getBoundingClientRect();
    const { clientX, clientY} = event;
    cloned.style.left = (event.clientX - rect.left + 10) + 'px';
    cloned.style.top = (event.clientY - rect.top + 10) + 'px';
    let element: HTMLElement | null = document.elementFromPoint(clientX, clientY) as HTMLElement;
    if (!element) return;
    if (!element.matches(movableSelector)) {
      element = element.closest(movableSelector);
    }
    if (!element) return;
    if (!element.matches(targetContentSelector)) {
      element = element?.querySelector(targetContentSelector) ?? null;
    }
    if (!element) return;
    const treeNodeElement = element.closest<HTMLElement>(movableSelector);
    if (!treeNodeElement || (event.target as HTMLElement).contains(element)) return;
    const { height, top } = element.getBoundingClientRect();
    const areaTop = top + height / 4;
    const areaBottom = top + height / 4 * 3;

    Array.from(document.getElementsByClassName(targetClassName))
      .forEach(d => d.classList
        .remove(targetClassName, willInsertBeforeClassName, willInsertAfterClassName, willInsertChildrenClassName)
      );
    if (clientY < areaTop) {
      element.classList.add(targetClassName, willInsertBeforeClassName);
    } else if (clientY > areaBottom) {
      element.classList.add(targetClassName, willInsertAfterClassName);
    } else {
      element.classList.add(targetClassName, willInsertChildrenClassName);
    }
  };
  
  const pointerupHandler = (event: PointerEvent) => {
    clearTimeout(dragStartTimeout);
    if (!dragging) return clear();
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);
    const to = document.getElementsByClassName(targetClassName)[0];
    const toNode = to?.closest<HTMLElement>(movableSelector);

    // 不能把自己移动到子节点内
    if (!toNode || source === toNode || source.contains(toNode)) return clear();

    let position: 'inside' | 'before' | 'after' = 'inside';
    if (to.classList.contains(willInsertBeforeClassName)) {
      position = 'before';
    } else if (to.classList.contains(willInsertAfterClassName)) {
      position = 'after';
    }

    logger.i('move', { source, toNode, position });
    // 不能把自己移动到子节点内
    callback({ source, target: toNode, position });

    clear();
  };

  return { pointerdownHandler, pointermoveHandler, pointerupHandler };
};