import { Exclude } from 'class-transformer';
import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export enum UserGender {
  Unknown = -1,
  Female = 0, // 女
  Male = 1, // 男
}

export enum RightRole {
  Normal = 1,
  Admin = 2,
}

@Entity()
export class User {
  @PrimaryColumn({
    type: 'varchar',
    nullable: false,
    comment: '用户名',
  })
  username: string;

  @Column({
    type: 'varchar',
    nullable: false,
    comment: '真实姓名',
  })
  realname: string;

  @Column({
    type: 'enum',
    enum: UserGender,
    nullable: false,
    default: UserGender.Unknown,
    comment: '性别',
  })
  gender: UserGender;

  @Column({
    type: 'varchar',
    nullable: true,
    comment: '学号',
  })
  studentId: string;

  @Column({
    type: 'varchar',
    nullable: true,
    comment: '班级',
  })
  className: string;

  @Exclude()
  @Column({
    type: 'varchar',
    nullable: false,
    name: 'password',
    length: 128,
    comment: '密码',
  })
  password: string;

  @Column({
    type: 'enum',
    enum: RightRole,
    nullable: false,
    name: 'rightRole',
    default: RightRole.Normal,
    comment: '权限角色',
  })
  rightRole: RightRole;

  @Column({
    type: 'simple-json',
    nullable: false,
    default: { seed: 'duan', color: 'eb5e1e' },
  })
  avatarOption: { seed: string; color: string };

  @Column({
    default: true,
    nullable: false,
    comment: '激活状态',
  })
  actived: boolean;

  @Column({
    type: 'varchar',
    nullable: true,
    default: '',
    comment: '备注',
  })
  remark: string;

  @CreateDateColumn({
    type: 'timestamp',
    nullable: false,
    comment: '创建时间',
  })
  createTime: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    nullable: false,
    comment: '更新时间',
  })
  updateTime: Date;
}
