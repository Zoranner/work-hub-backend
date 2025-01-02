import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Config {
  @PrimaryGeneratedColumn({
    comment: '唯一标识',
  })
  id: number;

  @Column({
    type: 'boolean',
    nullable: false,
    default: false,
    comment: '是否安装',
  })
  installed: boolean;

  @CreateDateColumn({
    type: 'timestamp',
    nullable: false,
    name: 'createTime',
    comment: '创建时间',
  })
  createTime: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    nullable: false,
    name: 'updateTime',
    comment: '更新时间',
  })
  updateTime: Date;
}
