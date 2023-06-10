import type { BaileysEventEmitter } from '@whiskeysockets/baileys';
import type { BaileysEventHandler } from '@baileys/store/types/store.type';
import { useLogger } from '@baileys/store/shared';
import { Repository, Not, In } from 'typeorm';
import { transformTypeOrm } from '@baileys/store/utils';
import { ContactEntity } from '../entities/contact.entity';

export class ContactHandler {
  private listening = false;
  private readonly logger = useLogger();
  private readonly sessionId;
  private event;

  constructor(
    sessionId: string,
    event: BaileysEventEmitter,
    private contactRepository: Repository<ContactEntity>,
  ) {
    this.sessionId = sessionId;
    this.event = event;
    this.listen = this.listen.bind(this);
    this.unlisten = this.unlisten.bind(this);
  }

  set: BaileysEventHandler<'messaging-history.set'> = async ({ contacts }) => {
    try {
      const contactIds = contacts.map((contact) => contact.id);
      const deletedOldContactIds = (
        await this.contactRepository.find({
          select: ['id'],
          where: {
            id: Not(In(contactIds)),
            sessionId: this.sessionId,
          },
        })
      ).map((contact) => contact.id);

      const upsertPromises = contacts
        .map((contact) => transformTypeOrm(contact))
        .map((data) =>
          this.contactRepository.upsert(
            { ...data, sessionId: this.sessionId },
            {
              conflictPaths: ['sessionId', 'id'],
            },
          ),
        );

      await Promise.all([
        ...upsertPromises,
        this.contactRepository.delete({
          id: In(deletedOldContactIds),
          sessionId: this.sessionId,
        }),
      ]);

      this.logger.info(
        {
          deletedContacts: deletedOldContactIds.length,
          newContacts: contacts.length,
        },
        'Synced contacts',
      );
    } catch (e) {
      this.logger.error(e, 'An error occured during contacts set');
    }
  };

  upsert: BaileysEventHandler<'contacts.upsert'> = async (contacts) => {
    try {
      await Promise.all(
        contacts
          .map((contact) => transformTypeOrm(contact))
          .map((data) =>
            this.contactRepository.upsert(
              { ...data, sessionId: this.sessionId },
              {
                skipUpdateIfNoValuesChanged: true,
                conflictPaths: ['sessionId', 'id'],
              },
            ),
          ),
      );
    } catch (e) {
      this.logger.error(e, 'An error occured during contacts upsert');
    }
  };

  update: BaileysEventHandler<'contacts.update'> = async (updates) => {
    for (const update of updates) {
      try {
        const data = transformTypeOrm(update);

        await this.contactRepository.update(
          {
            id: update.id!,
            sessionId: this.sessionId,
          },
          {
            ...data,
          },
        );
      } catch (e) {
        this.logger.error(e, 'An error occured during contact update');
      }
    }
  };

  listen() {
    if (this.listening) return;

    this.event.on('messaging-history.set', this.set);
    this.event.on('contacts.upsert', this.upsert);
    this.event.on('contacts.update', this.update);
    this.listening = true;
  }

  unlisten() {
    if (!this.listening) return;

    this.event.off('messaging-history.set', this.set);
    this.event.off('contacts.upsert', this.upsert);
    this.event.off('contacts.update', this.update);
    this.listening = false;
  }
}
