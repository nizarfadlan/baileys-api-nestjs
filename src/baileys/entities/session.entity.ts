import { Entity, Column, PrimaryGeneratedColumn, Index, Unique } from 'typeorm';

@Entity()
@Unique('unique_id_per_session_id_session', ['sessionId', 'id'])
@Index(['sessionId'])
export class SessionEntity {
  @PrimaryGeneratedColumn()
  pkId: number;

  @Column({ length: 128 })
  sessionId: string;

  @Column({ length: 128 })
  id: string;

  @Column({ type: 'text' })
  data: string;
}
