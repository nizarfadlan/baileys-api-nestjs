import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity()
@Unique('unique_message_key_per_session_id_message', [
  'sessionId',
  'remoteJid',
  'id',
])
@Index(['sessionId'])
export class MessageEntity {
  @PrimaryGeneratedColumn()
  pkId: number;

  @Column({ length: 128 })
  sessionId: string;

  @Column({ length: 128 })
  remoteJid: string;

  @Column({ length: 128 })
  id: string;

  @Column({ nullable: true, length: 128 })
  agentId?: string;

  @Column({ type: 'int', nullable: true })
  bizPrivacyStatus?: number;

  @Column({ type: 'boolean', nullable: true })
  broadcast?: boolean;

  @Column({ type: 'boolean', nullable: true })
  clearMedia?: boolean;

  @Column({ type: 'int', nullable: true })
  duration?: number;

  @Column({ type: 'int', nullable: true })
  ephemeralDuration?: number;

  @Column({ type: 'boolean', nullable: true })
  ephemeralOffToOn?: boolean;

  @Column({ type: 'boolean', nullable: true })
  ephemeralOutOfSync?: boolean;

  @Column({ type: 'bigint', nullable: true })
  ephemeralStartTimestamp?: number;

  @Column({ type: 'jsonb', nullable: true })
  finalLiveLocation?: object;

  @Column({ type: 'bytea', nullable: true })
  futureproofData?: Buffer;

  @Column({ type: 'boolean', nullable: true })
  ignore?: boolean;

  @Column({ type: 'jsonb', nullable: true })
  keepInChat?: object;

  @Column({ type: 'jsonb', nullable: true })
  key?: object;

  @Column({ type: 'jsonb', nullable: true })
  labels?: object;

  @Column({ type: 'bytea', nullable: true })
  mediaCiphertextSha256?: Buffer;

  @Column({ type: 'jsonb', nullable: true })
  mediaData?: object;

  @Column({ type: 'jsonb', nullable: true })
  message?: object;

  @Column({ type: 'bigint', nullable: true })
  messageC2STimestamp?: number;

  @Column({ type: 'bytea', nullable: true })
  messageSecret?: Buffer;

  @Column({ type: 'jsonb', nullable: true })
  messageStubParameters?: object;

  @Column({ type: 'int', nullable: true })
  messageStubType?: number;

  @Column({ type: 'bigint', nullable: true })
  messageTimestamp?: number;

  @Column({ type: 'boolean', nullable: true })
  multicast?: boolean;

  @Column({ nullable: true, length: 128 })
  originalSelfAuthorUserJidString?: string;

  @Column({ nullable: true, length: 128 })
  participant?: string;

  @Column({ type: 'jsonb', nullable: true })
  paymentInfo?: object;

  @Column({ type: 'jsonb', nullable: true })
  photoChange?: object;

  @Column({ type: 'jsonb', nullable: true })
  pollAdditionalMetadata?: object;

  @Column({ type: 'jsonb', nullable: true })
  pollUpdates?: object;

  @Column({ nullable: true, length: 128 })
  pushName?: string;

  @Column({ type: 'jsonb', nullable: true })
  quotedPaymentInfo?: object;

  @Column({ type: 'jsonb', nullable: true })
  quotedStickerData?: object;

  @Column({ type: 'jsonb', nullable: true })
  reactions?: object;

  @Column({ type: 'bigint', nullable: true })
  revokeMessageTimestamp?: number;

  @Column({ type: 'boolean', nullable: true })
  starred?: boolean;

  @Column({ type: 'int', nullable: true })
  status?: number;

  @Column({ type: 'boolean', nullable: true })
  statusAlreadyViewed?: boolean;

  @Column({ type: 'jsonb', nullable: true })
  statusPsa?: object;

  @Column({ type: 'boolean', nullable: true })
  urlNumber?: boolean;

  @Column({ type: 'boolean', nullable: true })
  urlText?: boolean;

  @Column({ type: 'jsonb', nullable: true })
  userReceipt?: object;

  @Column({ nullable: true, length: 128 })
  verifiedBizName?: string;
}
