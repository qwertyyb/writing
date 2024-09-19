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
  }

  settings = [
    {
      text: 'Personal Token',
      name: 'auth',
      extra: 'Github Personal Token'
    },
    {
      text: 'owner',
      name: 'owner',
      extra: 'Github Owner'
    },
    {
      text: 'repo',
      name: 'repo',
      extra: 'Github Repo'
    }
  ]
}