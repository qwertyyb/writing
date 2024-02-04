import NumberedListBlock from './NumberedListBlock.vue'
import BulletedListBlock from './BulletedListBlock.vue'

const numberedList = {
  identifier: 'ordered-list',
  label: '有序列表',

  component: NumberedListBlock
}

const bulletedList = {
  identifier: 'ordered-list',
  label: '有序列表',

  component: BulletedListBlock
}

export default [ numberedList, bulletedList ]