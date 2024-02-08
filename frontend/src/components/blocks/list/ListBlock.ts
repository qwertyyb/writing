import NumberedListBlock from './NumberedListBlock.vue'
import BulletedListBlock from './BulletedListBlock.vue'

const numberedList = {
  identifier: 'ordered-list',
  label: '有序列表',
  renderChildren: true,

  component: NumberedListBlock
}

const bulletedList = {
  identifier: 'unordered-list',
  label: '有序列表',
  renderChildren: true,

  component: BulletedListBlock
}

export default [ numberedList, bulletedList ]