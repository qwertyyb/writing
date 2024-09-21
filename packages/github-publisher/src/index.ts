import { IWritingApp, IWritingNote, IWritingPlugin } from "@writing/types"
import { GithubServer } from "./github-publisher.ts"
import { getFilePaths, transformFiles } from "./utils.ts"

export default class GithubPublisher implements IWritingPlugin {
  constructor(private app: IWritingApp) {
    this.app.addNoteAction({
      id: 'github-publisher:publish',
      title: '发布到Github',
      action: this.publishToGithub
    })
    this.app.addNoteAction({
      id: 'github-publisher:unpublish',
      title: '取消发布到Github',
      action: this.unpublishToGithub
    })
  }

  checkSettings = async () => {
    const settings = await this.app.getSettingsValue()
    if (!settings || !settings.auth || !settings.owner || !settings.repo) {
      this.app.messageBox.confirm('缺少必要的配置，是否打开配置？').then(() => {
        this.app.openSettings()
      })
      return false
    }
    return true
  }

  private githubKey: string = ''
  private github: GithubServer | null = null

  private getGithub = async () => {
    if (!await this.checkSettings()) return null
    const settings = this.app.getSettingsValue()
    const githubKey = [settings?.auth, settings?.owner, settings?.repo].join('-')
    if (this.githubKey !== githubKey || !this.github) {
      this.githubKey = githubKey
      this.github = new GithubServer(settings)
      await this.github.updateSha()
    }
    return this.github
  }

  publishToGithub = async (params: { current: IWritingNote }) => {
    // 检测到配置有变化时，重新初始化对应的 Github 操作实例
    await this.getGithub()
    if (!this.github) return
    let loading = this.app.message.info({ message: '收集文件中...', duration: 0 })
    const { files, note } = await transformFiles(params.current)
    loading.close()
    loading = this.app.message.info({ message: '发布中...', duration: 0 })
    const requests = files.map(file => {
      return this.github!.writeFile(file.blob, `server/posts/${note.id}/files/${file.name}`)
    })
    requests.push(this.github.writeJSON(note, `server/posts/${note.id}/index.json`))
    const results = await Promise.allSettled(requests)
    const errMsg = results.filter(item => item.status === 'rejected')
      .map(item => item.reason.message || item.reason.toString())
      .join('<br />')
    loading.close()
    if (errMsg) {
      this.app.message.error({ dangerouslyUseHTMLString: true, message: errMsg })
    } else {
      this.app.setAttribute(params.current.id, 'lastPublishTime', new Date().toISOString(), {
        label: '最后发布时间',
        formatValue: 'date',
      })
      this.app.notification.success('已成功发布')
    }
  }

  unpublishToGithub = async (params: { current: IWritingNote }) => {
    await this.getGithub()
    if (!this.github) return
    const loading = this.app.message({ message: '删除中...', duration: 0 })
    await this.github!.removeFile(`server/posts/${params.current.id}/index.json`)
    await this.app.removeAttributes(params.current.id, ['lastPublishTime'])
    loading.close()
    this.app.notification.success('已取消发布')
  }

  settings = [
    {
      text: 'Auth',
      name: 'auth',
      extra: 'Github Personal Token'
    },
    {
      text: 'owner',
      name: 'owner',
      extra: 'Github 用户'
    },
    {
      text: 'repo',
      name: 'repo',
      extra: 'Github 仓库名'
    }
  ]
}