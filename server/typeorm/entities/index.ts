import {
  Entity,
  PrimaryGeneratedColumn, Column, PrimaryColumn,
  CreateDateColumn, UpdateDateColumn,
  OneToOne, JoinColumn, OneToMany, ManyToOne,
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