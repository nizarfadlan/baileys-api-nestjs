import { Entity, Index, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';

@Entity()
@Unique('unique_id_per_session_id_chat', ['sessionId', 'id'])
@Index(['sessionId'])
export class ChatEntity {
  @PrimaryGeneratedColumn()
  pkId: number;

  @Column({ length: 128 })
  sessionId: string;

  @Column({ type: 'boolean', nullable: true })
  archived?: boolean;

  @Column({ type: 'bytea', nullable: true })
  contactPrimaryIdentityKey?: Buffer;

  @Column({ type: 'bigint', nullable: true })
  conversationTimestamp?: number;

  @Column({ type: 'bigint', nullable: true })
  createdAt?: number;

  @Column({ nullable: true, length: 128 })
  createdBy?: string;

  @Column({ nullable: true, length: 255 })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  disappearingMode?: object;

  @Column({ nullable: true, length: 128 })
  displayName?: string;

  @Column({ type: 'boolean', nullable: true })
  endOfHistoryTransfer?: boolean;

  @Column({ type: 'int', nullable: true })
  endOfHistoryTransferType?: number;

  @Column({ type: 'int', nullable: true })
  ephemeralExpiration?: number;

  @Column({ type: 'bigint', nullable: true })
  ephemeralSettingTimestamp?: number;

  @Column({ length: 128 })
  id: string;

  @Column({ type: 'boolean', nullable: true })
  isDefaultSubgroup?: boolean;

  @Column({ type: 'boolean', nullable: true })
  isParentGroup?: boolean;

  @Column({ type: 'bigint', nullable: true })
  lastMsgTimestamp?: number;

  @Column({ nullable: true, length: 128 })
  lidJid?: string;

  @Column({ type: 'boolean', nullable: true })
  markedAsUnread?: boolean;

  @Column({ type: 'int', nullable: true })
  mediaVisibility?: number;

  @Column({ type: 'jsonb', nullable: true })
  messages?: object;

  @Column({ type: 'bigint', nullable: true })
  muteEndTime?: number;

  @Column({ nullable: true, length: 128 })
  name?: string;

  @Column({ nullable: true, length: 128 })
  newJid?: string;

  @Column({ type: 'boolean', nullable: true })
  notSpam?: boolean;

  @Column({ nullable: true, length: 128 })
  oldJid?: string;

  @Column({ nullable: true, length: 128 })
  pHash?: string;

  @Column({ nullable: true, length: 128 })
  parentGroupId?: string;

  @Column({ type: 'jsonb', nullable: true })
  participant?: object;

  @Column({ type: 'int', nullable: true })
  pinned?: number;

  @Column({ nullable: true, length: 128 })
  pnJid?: string;

  @Column({ type: 'boolean', nullable: true })
  pnhDuplicateLidThread?: boolean;

  @Column({ type: 'boolean', nullable: true })
  readOnly?: boolean;

  @Column({ type: 'boolean', nullable: true })
  shareOwnPn?: boolean;

  @Column({ type: 'boolean', nullable: true })
  support?: boolean;

  @Column({ type: 'boolean', nullable: true })
  suspended?: boolean;

  @Column({ type: 'bytea', nullable: true })
  tcToken?: Buffer;

  @Column({ type: 'bigint', nullable: true })
  tcTokenSenderTimestamp?: number;

  @Column({ type: 'bigint', nullable: true })
  tcTokenTimestamp?: number;

  @Column({ type: 'boolean', nullable: true })
  terminated?: boolean;

  @Column({ type: 'int', nullable: true })
  unreadCount?: number;

  @Column({ type: 'int', nullable: true })
  unreadMentionCount?: number;

  @Column({ type: 'jsonb', nullable: true })
  wallpaper?: object;

  @Column({ type: 'int', nullable: true })
  lastMessageRecvTimestamp?: number;
}
