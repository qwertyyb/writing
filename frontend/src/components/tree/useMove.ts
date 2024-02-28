import { useDocumentStore } from "@/stores/document"
import { createLogger } from "@/utils/logger"

const logger = createLogger('useMove')

export const useMove = () => {
  const getTreeNodeEl = (event: PointerEvent) => {
    const element = event.target as HTMLElement
    if (element?.classList.contains('.doc-tree-node')) return element
    return element.closest<HTMLElement>('.doc-tree-node')
  }

  let cloned: HTMLElement | null = null
  let dragging = false
  let dragStartTimeout: ReturnType<typeof setTimeout>
  const clear = () => {
    document.querySelectorAll('.movable-selected')
      .forEach(d => d.classList
      .remove('movable-selected', 'movable-insert-children', 'movable-insert-before', 'movable-insert-after')
    );
    document.querySelector('.movable-source')?.classList.remove('movable-source')
    cloned?.parentElement?.removeChild(cloned)
    cloned = null
    dragging = false
  }

  const pointerdownHandler = (event: PointerEvent) => {
    if (event.buttons !== 1) return
    dragStartTimeout = setTimeout(() => {
      const treeNodeEl = getTreeNodeEl(event)
      if (!treeNodeEl) return
      if (!treeNodeEl.dataset.treeIndexPath) return
      treeNodeEl.setPointerCapture(event.pointerId)
      cloned = treeNodeEl.cloneNode(true) as HTMLElement
      cloned.classList.add('movable-cloned')
      cloned.style.height = treeNodeEl.clientHeight + 'px'
      cloned.style.width = treeNodeEl.clientWidth + 'px'
      const rect = treeNodeEl.parentElement!.getBoundingClientRect()
      cloned.style.left = (event.clientX - rect.left) + 'px'
      cloned.style.top = (event.clientY - rect.top) + 'px'
      treeNodeEl.parentElement!.appendChild(cloned)
      treeNodeEl.classList.add('movable-source')
      dragging = true
    }, 200)
  }
  
  const pointermoveHandler = (event: PointerEvent) => {
    if (event.buttons !== 1 || !cloned || !dragging) return
    event.preventDefault()
    const rect = (event.target as HTMLElement).parentElement!.getBoundingClientRect()
    const { clientX, clientY} = event
    cloned.style.left = (event.clientX - rect.left) + 'px'
    cloned.style.top = (event.clientY - rect.top) + 'px'
    let element: HTMLElement | null = document.elementFromPoint(clientX, clientY) as HTMLElement
    if (!element?.classList.contains('doc-tree-node')) {
      element = element!.closest('.doc-tree-node')
    }
    element = element?.querySelector('.tree-node-content') ?? null
    if (!element) return
    const treeNodeElement = element.closest<HTMLElement>('.doc-tree-node')
    if (!treeNodeElement || (event.target as HTMLElement).contains(element)) return
  
    const { height, top } = element.getBoundingClientRect()
    const areaTop = top + height / 4
    const areaBottom = top + height / 4 * 3
  
    
    document.querySelectorAll('.movable-selected')
      .forEach(d => d.classList
      .remove('movable-selected', 'movable-insert-children', 'movable-insert-before', 'movable-insert-after')
    );
    if (clientY < areaTop) {
      element.classList.add('movable-selected', 'movable-insert-before')
    } else if (clientY > areaBottom) {
      element.classList.add('movable-selected', 'movable-insert-after')
    } else {
      element.classList.add('movable-selected', 'movable-insert-children')
    }
  }
  
  const pointerupHandler = (event: PointerEvent) => {
    clearTimeout(dragStartTimeout);
    if (!dragging) return
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);
    const to = document.querySelector('.movable-selected')
    const toNode = to?.closest<HTMLElement>('.doc-tree-node')
    const source = event.target as HTMLElement

    if (to && toNode && to !== source && source.dataset.treeNodeId !== toNode.dataset.treeNodeId) {
      const toIndexPath = toNode.dataset.treeIndexPath?.split(',').filter(i => i).map(i => Number(i)) ?? []
      if (!toIndexPath.length) return clear()
      let position: 'inside' | 'before' | 'after' = 'inside'
      if (to.classList.contains('movable-insert-before')) {
        position = 'before'
      } else if (to.classList.contains('movable-insert-after')) {
        position = 'after'
      }

      const sourceIndexPath = source.dataset.treeIndexPath?.split(',').filter(i => i).map(i => Number(i)) ?? []
      const sourceId = Number(source.dataset.treeNodeId)
      const toId = Number(toNode.dataset.treeNodeId)

      logger.i('move', { sourceId, sourceIndexPath, toIndexPath, toId, position })
      // 不能把自己移动到子节点内
      if (toIndexPath.join(',').startsWith(sourceIndexPath.join(','))) return clear()
      useDocumentStore().move({ sourceId, sourceIndexPath, toIndexPath, toId, position })
    }

    clear()
  }

  return { pointerdownHandler, pointermoveHandler, pointerupHandler }
}