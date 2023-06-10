import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity()
@Unique('unique_id_per_session_id_contact', ['sessionId', 'id'])
@Index(['sessionId'])
export class ContactEntity {
  @PrimaryGeneratedColumn()
  pkId: number;

  @Column({ length: 128 })
  sessionId: string;

  @Column({ length: 128 })
  id: string;

  @Column({ nullable: true, length: 128 })
  name?: string;

  @Column({ nullable: true, length: 128 })
  notify?: string;

  @Column({ nullable: true, length: 128 })
  verifiedName?: string;

  @Column({ nullable: true, length: 255 })
  imgUrl?: string;

  @Column({ nullable: true, length: 128 })
  status?: string;
}
