interface AddPostAction {
  type: 'addPost',
  payload: Post
}

interface UpdatePostAction {
  type: 'updatePost',
  payload: Post
}

interface RemovePostAction {

}

interface AddFileAction {

}

interface RemoveFileAction {

}

interface UpdateMetaAction {

}

type Action = AddPostAction | UpdatePostAction | RemovePostAction | AddFileAction | RemoveFileAction | UpdateMetaAction


const getEndpoints = (): string[] => {
  return []
}

const sendToEndpoints = (action: Action) => {
}