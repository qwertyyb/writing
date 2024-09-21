import { service } from '@/services'
import { useDocumentStore } from '@/stores/document'
import type { IAttributeOptions, INoteAction, IWritingApp, IWritingPlugin, IWritingPluginConstructor } from '@writing/types'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { computed, markRaw, reactive, shallowReactive, type ShallowReactive } from 'vue'

export interface IPluginMeta {
  name: string
  title: string
  author?: string
  url?: string
}

interface IPluginRuntimeData {
  // 要存
  status: 'enabled' | 'disabled' | 'removed'
  meta: IPluginMeta,
  PluginClass: IWritingPluginConstructor,
  noteActions: INoteAction[]
  // 要存
  settingsValue?: any
}

export const pluginsRuntime: Record<string, IPluginRuntimeData> = reactive({})

export const pluginInstances: ShallowReactive<Record<string, IWritingPlugin>> = shallowReactive({})

export const noteActions = computed<INoteAction[]>(() => {
  console.log(pluginsRuntime)
  return Object.values(pluginsRuntime).map(item => item.status === 'enabled' ? item?.noteActions || [] : []).flat()
})

export class WritingApp implements IWritingApp {
  notification = ElNotification
  messageBox = ElMessageBox
  message = ElMessage

  constructor(private meta: IPluginMeta, config?: Pick<IPluginRuntimeData, 'status' | 'settingsValue'>) {
    pluginsRuntime[meta.name] = {
      ...pluginsRuntime[meta.name],
      noteActions: [],
      settingsValue: config?.settingsValue ?? null
    }
  }

  fetch = (...args: Parameters<typeof fetch>) => {
    return window.fetch('/api/v1/plugin/fetch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        args
      })
    })
  }

  addNoteAction = (action: INoteAction) => {
    console.assert(!!pluginsRuntime[this.meta.name], `未找到插件${this.meta.name}`)
    const existsIndex = pluginsRuntime[this.meta.name]!.noteActions.findIndex(item => item.id === action.id)
    if (existsIndex > -1) {
      pluginsRuntime[this.meta.name]!.noteActions[existsIndex] = markRaw(action)
    } else {
      pluginsRuntime[this.meta.name]!.noteActions.push(markRaw(action))
    }
  }

  setAttribute = async (noteId: number, key: string, value: string, options?: IAttributeOptions) => {
    const pluginKey = `Plugin.${this.meta.name}.${key}`
    await useDocumentStore().updateAttributes(noteId, [{ key: pluginKey, value, options }])
  }
  setAttributes = async (noteId: number, attributes: { key: string, value: string, options?: IAttributeOptions }[]) => {
    const pluginAttrs = attributes.map(attr => ({ ...attr, key: `Plugin.${this.meta.name}.${attr.key}` }))
    await useDocumentStore().updateAttributes(noteId, pluginAttrs)
  }
  removeAttributes = async (noteId: number, keys: string[]) => {
    const pluginKeys = keys.map(key => `Plugin.${this.meta.name}.${key}`)
    await useDocumentStore().removeAttributes(noteId, pluginKeys)
  }

  getSettingsValue = () => {
    return pluginsRuntime[this.meta.name]!.settingsValue
  }

  currentNote = () => {
    const current = useDocumentStore().editing
    return Promise.resolve(current ? { ...current, content: JSON.stringify(current.content) } : null)
  }

  openSettings = () => {
    document.dispatchEvent(new CustomEvent('openSettings', { detail: { tab: `Plugin.${this.meta.name}`} }))
  }
}

export const addPlugin = async (meta: IPluginMeta, WritingPlugin: IWritingPluginConstructor) => {
  const configJson = await service.configService.getValue(`Plugin.${meta.name}`)
  const config = configJson ? JSON.parse(configJson) : null
  pluginsRuntime[meta.name] = {
    meta,
    status: config?.status ?? 'enabled',
    PluginClass: WritingPlugin,
    noteActions: []
  }
  const app = new WritingApp(meta, config)
  if (!config?.status || config?.status === 'enabled') {
    pluginInstances[meta.name] = new WritingPlugin(app)
  }
}

export const removePlugin = (name: string, options = { clearData: false }) => {
  pluginInstances[name]?.destroy?.()
  delete pluginInstances[name]
  pluginsRuntime[name]!.status = 'removed'
  if (options.clearData) {
    delete pluginsRuntime[name]
  }
}

export const togglePlugin = async (name: string, status?: 'enabled' | 'disabled') => {
  if (pluginsRuntime[name].status === status) return
  await service.configService.setValue(`Plugin.${name}`, JSON.stringify({
    status,
    settingsValue: pluginsRuntime[name].settingsValue
  }))
  if (status === 'enabled') {
    pluginsRuntime[name].status = 'enabled'
    const PluginClass = pluginsRuntime[name].PluginClass
    addPlugin(pluginsRuntime[name].meta, PluginClass)
  } else {
    pluginsRuntime[name].status = 'disabled'
    pluginInstances[name]?.destroy?.()
    delete pluginInstances[name]
  }
}
