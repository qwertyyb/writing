import { useDocumentStore } from '@/stores/document'
import type { INoteAction, IWritingApp, IWritingPlugin, IWritingPluginConstructor } from '@writing/types'
import { ElNotification } from 'element-plus'
import { computed, markRaw, reactive } from 'vue'

export interface IPluginMeta {
  name: string
  title: string
  author?: string
  url?: string
}

interface IPluginRuntimeData {
  status: 'enabled' | 'disabled' | 'removed'
  noteActions: INoteAction[]
  settingsValue?: any
}

const pluginsRuntime: Record<string, IPluginRuntimeData | undefined> = reactive({})
export const plugins: Record<string, { instance: IWritingPlugin, meta: IPluginMeta }> = reactive({})
const pluginsMeta: Record<string, IPluginMeta> = reactive({})

export const noteActions = computed<INoteAction[]>(() => {
  return Object.values(pluginsRuntime).map(item => item?.noteActions || []).flat()
})

export class WritingApp implements IWritingApp {
  notification = ElNotification

  constructor(private meta: IPluginMeta) {
    pluginsMeta[meta.name] = markRaw(meta)
    pluginsRuntime[meta.name] = {
      status: pluginsRuntime[meta.name]?.status ? pluginsRuntime[meta.name]!.status : 'enabled',
      noteActions: [],
    }
  }

  addNoteAction = (action: INoteAction) => {
    const existsIndex = pluginsRuntime[this.meta.name]!.noteActions.findIndex(item => item.id === action.id)
    if (existsIndex > -1) {
      pluginsRuntime[this.meta.name]!.noteActions[existsIndex] = markRaw(action)
    } else {
      pluginsRuntime[this.meta.name]!.noteActions.push(markRaw(action))
    }
  }

  getSettingsValue = () => {
    return pluginsRuntime[this.meta.name]!.settingsValue
  }

  currentNote = () => {
    const current = useDocumentStore().editing
    return current ? { ...current, content: JSON.stringify(current.content) } : null
  }
}

export const addPlugin = (meta: IPluginMeta, WritingPlugin: IWritingPluginConstructor) => {
  const app = new WritingApp(meta)
  plugins[meta.name] = markRaw({
    meta,
    instance: new WritingPlugin(app)
  })
}

export const removePlugin = (name: string, options = { clearData: false }) => {
  plugins[name]?.instance?.destroy?.()
  delete plugins[name]
  pluginsRuntime[name]!.status = 'removed'
  if (options.clearData) {
    delete pluginsRuntime[name]
  }
}
