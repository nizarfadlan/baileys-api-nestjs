import { Entity, Index, Unique, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
@Unique('unique_id_per_session_id_grup', ['sessionId', 'id'])
@Index(['sessionId'])
export class GroupMetaDataEntity {
  @PrimaryGeneratedColumn()
  pkId: number;

  @Column({ length: 128 })
  sessionId: string;

  @Column({ length: 128 })
  id: string;

  @Column({ nullable: true, length: 128 })
  owner?: string;

  @Column({ length: 128 })
  subject: string;

  @Column({ nullable: true, length: 128 })
  subjectOwner?: string;

  @Column({ type: 'bigint', nullable: true })
  subjectTime?: number;

  @Column({ type: 'bigint', nullable: true })
  creation?: number;

  @Column({ nullable: true, length: 255 })
  desc?: string;

  @Column({ nullable: true, length: 128 })
  descOwner?: string;

  @Column({ nullable: true, length: 128 })
  descId?: string;

  @Column({ type: 'boolean', nullable: true })
  restrict?: boolean;

  @Column({ type: 'boolean', nullable: true })
  announce?: boolean;

  @Column({ type: 'int', nullable: true })
  size?: number;

  @Column({ type: 'jsonb', nullable: false })
  participants: object;

  @Column({ type: 'int', nullable: true })
  ephemeralDuration?: number;

  @Column({ nullable: true, length: 255 })
  inviteCode?: string;
}
