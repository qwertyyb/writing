import path from 'path';
import {
  Entity,
  PrimaryGeneratedColumn, Column, PrimaryColumn,
  CreateDateColumn, UpdateDateColumn,
  OneToOne, JoinColumn, OneToMany, ManyToOne,
  DataSource
} from 'typeorm';

abstract class DateTime {
  @CreateDateColumn()
    createdAt: Date;

  @UpdateDateColumn()
    updatedAt: Date;
}

@Entity()
export class File extends DateTime {
  @PrimaryColumn()
    name: string;

  @Column()
    content: Buffer;

  @Column()
    mimetype: string;
}

@Entity()
export class Attribute extends DateTime {
  @PrimaryColumn()
    key: string;

  @Column({ nullable: true })
    value?: string;

  @Column({ nullable: true})
    comment?: string;
  
  @PrimaryColumn()
    docId: number;

  @ManyToOne(() => Document, document => document.attributes)
    doc: Document;
}

@Entity()
export class Document extends DateTime {
  @PrimaryGeneratedColumn()
    id: number;

  @Column()
    title: string;

  @Column()
    content: string;

  @Column()
    path: string;

  @Column({
    type: 'boolean',
    default: false
  })
    deleted: boolean = false;

  @Column('datetime', { nullable: true })
    deletedAt?: Date;

  @Column({ nullable: true })
    nextId?: number;

  @OneToOne(() => Document, document => document.prev)
  @JoinColumn()
    next?: Document;

  @OneToOne(() => Document, document => document.next)
    prev?: Document;

  @OneToMany(() => Attribute, attribute => attribute.doc)
    attributes: Attribute[];
}

@Entity()
export class Config extends DateTime {
  @PrimaryColumn()
    key: string;

  @Column({ nullable: true })
    value?: string;

  @Column({ nullable: true })
    comment?: string;
}

const appDataSource = new DataSource({
  type: 'sqlite',
  database: path.resolve(__dirname, '../../data/new-sqlite.db'),
  entities: [File, Document, Attribute, Config],
  synchronize: true,
  dropSchema: true,
});

appDataSource.initialize()
  .then(async (dataSource) => {
    const hasRoot = await dataSource.manager.count(Document, { where: { path: '' } });
    if (hasRoot) return;
    await dataSource.manager.insert(Document, {
      title: 'root',
      content: JSON.stringify({
        id: 'root',
        type: 'doc',
        data: { title: 'root' },
        children: [
          {
            type: 'text',
            id: 'rootext',
            data: {
              html: '这是根文档',
            },
          },
        ],
      }),
      path: '',
    });
  });

const document = appDataSource.getRepository(Document);
const config = appDataSource.getRepository(Config);
const file = appDataSource.getRepository(File);
const attribute = appDataSource.getRepository(Attribute);

export const orm = {
  document, config, file, attribute,
  $transaction: appDataSource.transaction.bind(appDataSource) as typeof appDataSource.transaction
};
