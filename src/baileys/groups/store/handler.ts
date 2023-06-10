import type { BaileysEventEmitter } from '@whiskeysockets/baileys';
import type { BaileysEventHandler } from '@baileys/store/types/store.type';
import { useLogger } from '@baileys/store/shared';
import { QueryFailedError, Repository } from 'typeorm';
import { transformTypeOrm } from '@baileys/store/utils';
import { GroupMetaDataEntity } from '../entities/groupMetaData.entity';

export class GroupMetaDataHandler {
  private listening = false;
  private readonly logger = useLogger();
  private readonly sessionId;
  private event;

  constructor(
    sessionId: string,
    event: BaileysEventEmitter,
    private groupMetaDataRepository: Repository<GroupMetaDataEntity>,
  ) {
    this.sessionId = sessionId;
    this.event = event;
    this.listen = this.listen.bind(this);
    this.unlisten = this.unlisten.bind(this);
  }

  upsert: BaileysEventHandler<'groups.upsert'> = async (groups) => {
    try {
      await Promise.all(
        groups
          .map((group) => transformTypeOrm(group))
          .map((data) =>
            this.groupMetaDataRepository.upsert(
              { ...data, sessionId: this.sessionId },
              {
                skipUpdateIfNoValuesChanged: true,
                conflictPaths: ['sessionId', 'id'],
              },
            ),
          ),
      );
    } catch (e) {
      this.logger.error(e, 'An error occured during groups upsert');
    }
  };

  update: BaileysEventHandler<'groups.update'> = async (updates) => {
    for (const update of updates) {
      try {
        const data = transformTypeOrm(update);

        await this.groupMetaDataRepository.update(
          {
            id: update.id!,
            sessionId: this.sessionId,
          },
          {
            ...data,
          },
        );
      } catch (e) {
        if (e instanceof QueryFailedError) {
          return this.logger.info(
            { update },
            'Got metadata update for sessionId on existent group',
          );
        }
        this.logger.error(e, 'An error occured during group metadata update');
      }
    }
  };

  updateParticipants: BaileysEventHandler<'group-participants.update'> =
    async ({ id, participants, action }) => {
      try {
        const metadataGroups = ((await this.groupMetaDataRepository.findOne({
          select: ['participants'],
          where: {
            id,
            sessionId: this.sessionId,
          },
        })) || []) as { participants: any[] } | null;

        if (!metadataGroups) {
          return this.logger.info(
            { update: { id, action, participants } },
            'Got participants update for non existent group',
          );
        }

        switch (action) {
          case 'add':
            metadataGroups.participants.push(
              participants.map((id) => ({
                id,
                isAdmin: false,
                isSuperAdmin: false,
              })),
            );
            break;
          case 'demote':
          case 'promote':
            for (const participant of metadataGroups.participants) {
              if (participants.includes(participant.id)) {
                participant.isAdmin = action === 'promote';
              }
            }
            break;
          case 'remove':
            metadataGroups.participants = metadataGroups.participants.filter(
              (p) => !participants.includes(p.id),
            );
            break;
        }

        await this.groupMetaDataRepository.update(
          {
            id,
            sessionId: this.sessionId,
          },
          {
            ...transformTypeOrm({ participants: metadataGroups.participants }),
          },
        );
      } catch (e) {
        this.logger.error(
          e,
          'An error occured during group update participants',
        );
      }
    };

  listen() {
    if (this.listening) return;

    this.event.on('groups.upsert', this.upsert);
    this.event.on('groups.update', this.update);
    this.event.on('group-participants.update', this.updateParticipants);
    this.listening = true;
  }

  unlisten() {
    if (!this.listening) return;

    this.event.off('groups.upsert', this.upsert);
    this.event.off('groups.update', this.update);
    this.event.on('group-participants.update', this.updateParticipants);
    this.listening = false;
  }
}
