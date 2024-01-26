import Hexo from 'hexo'
import { PROJECT_PATH } from '../config'

const hexo = new Hexo(PROJECT_PATH);

class Posts {
  add(title: string) {
    return new Promise((resolve, reject) => hexo.post.create({
      title,
    }, (err, result) => {
      if (err) return reject(err)
      resolve(result);
    }))
  }
  query() {
    return hexo.model('Post').map(post => {
      const date = post.published ? post.date.format('YYYY-MM-DD') : 'Draft';
      const tags = post.tags.map(tag => tag.name);
      const categories = post.categories.map(category => category.name);
      const title = post.title;
      return {
        title, date, tags, categories, updated: post.updated
      }
    })
  }
  remove(title: string) {
    return hexo.model('Post').remove({ title })
  }
  update(title: string, data) {
  }
}




