import NumberedListBlock from './NumberedListBlock.vue';
import BulletedListBlock from './BulletedListBlock.vue';

const numberedList = {
  identifier: 'ordered-list',
  label: '有序列表',
  icon: 'format_list_numbered',
  renderChildren: true,

  component: NumberedListBlock
};

const bulletedList = {
  identifier: 'unordered-list',
  label: '无序列表',
  icon: 'format_list_bulleted',
  renderChildren: true,

  component: BulletedListBlock
};

export default [ numberedList, bulletedList ];