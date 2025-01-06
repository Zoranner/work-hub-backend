import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('encryption_sessions')
export class EncryptionSession {
  @PrimaryColumn()
  userId: string;

  @Column()
  deviceId: string;

  @Column()
  accessToken: string;

  @Column({ nullable: true })
  syncToken: string;
}
