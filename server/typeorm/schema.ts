import path from 'path';
import { DataSource } from 'typeorm';
import * as entities from './entities';
import { QuerySubscriber } from './subscribers';

const appDataSource = new DataSource({
  type: 'sqlite',
  database: path.resolve(__dirname, '../../data/db.sqlite'),
  entities: Object.values(entities),
  subscribers: [QuerySubscriber],
  synchronize: true,
});

appDataSource.initialize()
  .then(async (dataSource) => {
    const hasRoot = await dataSource.manager.count(entities.Document, { where: { path: '' } });
    if (hasRoot) return;
    const content = {
      id: 'root',
      type: 'doc',
      data: { title: 'root' },
      children: [
        {
          type: 'text',
          id: 'rootext',
          data: {
            ops: [{ insert: '这是根文档' }],
          },
        },
      ],
    };
    await dataSource.manager.insert(entities.Document, {
      title: 'root',
      content: JSON.stringify(content),
      path: '',
    });
  });

const document = appDataSource.getRepository(entities.Document);
const config = appDataSource.getRepository(entities.Config);
const file = appDataSource.getRepository(entities.File);
const attribute = appDataSource.getRepository(entities.Attribute);

export const orm = {
  document, config, file, attribute,
  $transaction: appDataSource.transaction.bind(appDataSource) as typeof appDataSource.transaction,
  $queryRaw: appDataSource.query.bind(appDataSource) as typeof appDataSource.query
};

export { entities };
