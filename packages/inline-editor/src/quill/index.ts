import Quill from 'quill';
import { Markdown } from './markdown';

const fontSizeArr = new Array(100).fill(0).map((_, index) => (10 + index) + 'px');

const Size = Quill.import('attributors/style/size');
Size.whitelist = fontSizeArr;
Quill.register(Size, true);

Quill.register('modules/markdown', Markdown);

export default Quill;