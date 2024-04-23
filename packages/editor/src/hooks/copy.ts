import { createLogger } from '@writing/utils/logger';
import { onBeforeUnmount, onMounted } from 'vue';

const logger = createLogger('copy');

export const useCopy = () => {
  const copyHandler = (event: ClipboardEvent) => {
    logger.i('copyHandler', event);
    const div = document.createElement('div');
    div.style.cssText = 'width:0;height:0;overflow:hidden';
    div.appendChild(window.getSelection().getRangeAt(0).cloneContents());
    // 需要把节点先插入到页面中，才能使用 innerText 获取到正常带换行的内容
    document.body.appendChild(div);
    try {
      event.clipboardData.setData('text/html', div.innerHTML);
      event.clipboardData.setData('text/plain', div.innerText);
      event.clipboardData.setData('text/writing-data', 'hello');
      event.preventDefault();
      document.body.removeChild(div);
    } catch (err) {
      document.body.removeChild(div);
    }
  };

  onMounted(() => {
    document.addEventListener('copy', copyHandler);
  });

  onBeforeUnmount(() => {
    document.removeEventListener('copy', copyHandler);
  });
};