import Quill from 'quill'
import { Markdown } from './markdown'

Quill.register('modules/markdown', Markdown)

export default Quill