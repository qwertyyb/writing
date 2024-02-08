import { type BlockModel } from "@/models/block";

export const getBlockByPath = (root: BlockModel, path: number[]) => {
  // 路径上的第一个值恒为0，指root本身
  const [first, ...restPath] = path
  if (first !== 0) throw new Error('路径的第一个元素为根节点，应该恒为0')
  let node = root
  while(restPath.length) {
    const curIndex = restPath.shift()!
    if (node.children?.[curIndex]) {
      node = node.children[curIndex]
    } else {
      throw new Error(`路径${JSON.stringify(path)}不正确`)
    }
  }
  return node
}

export const checkMove = (root: BlockModel, oldPath: number[], newPath: number[]) => {
  // 1. 首先判断能否移动
  /**
   * 能否移动的判断标准为:
   * a. 旧路径上该节点存在
   * b. 能到达新路径
   */
  // 判断旧路径该节点存在，即通过旧路径能拿到该节点
  // 不能移动root节点，所以oldPath的长度至少为2
  if (oldPath.length < 2) {
    throw new Error('旧路径不合法，无法移动')
  }
  const oldPathParentNode = getBlockByPath(root, oldPath.slice(0, oldPath.length - 1))
  const oldIndex = oldPath[oldPath.length - 1]
  if (!oldPathParentNode.children?.[oldIndex]) {
    throw new Error('待移动的节点不存在')
  }

  // 新路径合法性的判断，首先需要判断其路径的父节点存在，因为最后的子节点是待移入的，所以是有可能不存在的
  // 其次需要判断待移入的节点在父节点的合法性，比如不能超出当前子节点的数量，不能为负数等
  // 所以新路径的最短长度为2，即移动为root节点的直接子节点
  if (newPath.length < 2) {
    throw new Error('新路径不合法，无法移动')
  }
  const newPathParentNode = getBlockByPath(root, newPath.slice(0, newPath.length - 1))
  const newIndex = newPath[newPath.length - 1]
  if (newIndex < 0 || newIndex > (newPathParentNode.children?.length ?? 0)) {
    throw new Error('新路径不存在')
  }
  return { oldPathParent: oldPathParentNode, oldIndex: oldPath[oldPath.length - 1], newPathParent: newPathParentNode, newIndex: newPath[newPath.length - 1] }
}