import { IWritingApp, IWritingPlugin } from "@writing/types"

export default class GithubPublisher implements IWritingPlugin {
  constructor(private app: IWritingApp) {
    this.app.addNoteAction({
      id: 'github-publisher',
      title: '发布到Github',
      action(params) {
        app.notification.success('已成功发布')
      },
    })
    app.fetch('https://www.baidu.com').then(async response => {
      console.log(response)
      console.log(await response.text())
    })
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