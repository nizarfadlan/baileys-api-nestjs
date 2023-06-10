import type { BaileysEventEmitter } from '@whiskeysockets/baileys';
import type { BaileysEventHandler } from '@baileys/store/types/store.type';
import { useLogger } from '@baileys/store/shared';
import { In, QueryFailedError, Repository } from 'typeorm';
import { transformTypeOrm } from '@baileys/store/utils';
import { ChatEntity } from '../entities/chat.entity';

export class ChatHandler {
  private listening = false;
  private readonly logger = useLogger();
  private readonly sessionId;
  private event;

  constructor(
    sessionId: string,
    event: BaileysEventEmitter,
    private chatRepository: Repository<ChatEntity>,
  ) {
    this.sessionId = sessionId;
    this.event = event;
    this.listen = this.listen.bind(this);
    this.unlisten = this.unlisten.bind(this);
  }

  set: BaileysEventHandler<'messaging-history.set'> = async ({
    chats,
    isLatest,
  }) => {
    try {
      if (isLatest)
        await this.chatRepository.delete({ sessionId: In(this.sessionId) });

      const chatIds = chats.map((chat) => chat.id);
      const existingIds = (
        await this.chatRepository.find({
          select: ['id'],
          where: {
            id: In(chatIds),
            sessionId: this.sessionId,
          },
        })
      ).map((chat) => chat.id);

      const chatsToAdd = chats
        .filter((chat) => !existingIds.includes(chat.id))
        .map((chat) => ({
          ...transformTypeOrm(chat),
          sessionId: this.sessionId,
        }));

      const addedChats = this.chatRepository.create(chatsToAdd);
      await this.chatRepository.insert(addedChats);

      this.logger.info({ chatsAdded: chatsToAdd.length }, 'Synced chats');
    } catch (e) {
      this.logger.error(e, 'An error occured during chats set');
    }
  };

  upsert: BaileysEventHandler<'chats.upsert'> = async (chats) => {
    try {
      await Promise.all(
        chats
          .map((chat) => transformTypeOrm(chat))
          .map((data) =>
            this.chatRepository.upsert(
              { ...data, sessionId: this.sessionId },
              {
                skipUpdateIfNoValuesChanged: true,
                conflictPaths: ['sessionId', 'id'],
              },
            ),
          ),
      );
    } catch (e) {
      this.logger.error(e, 'An error occured during chats upsert');
    }
  };

  update: BaileysEventHandler<'chats.update'> = async (updates) => {
    for (const update of updates) {
      try {
        const data = transformTypeOrm(update);

        const chat = await this.chatRepository.findOne({
          where: {
            id: update.id!,
            sessionId: this.sessionId,
          },
        });

        await this.chatRepository.update(
          {
            id: update.id!,
            sessionId: this.sessionId,
          },
          {
            ...data,
            unreadCount:
              typeof data.unreadCount === 'number'
                ? data.unreadCount > 0
                  ? (chat.unreadCount ?? 0) + data.unreadCount
                  : data.unreadCount
                : undefined,
          },
        );
      } catch (e) {
        if (e instanceof QueryFailedError) {
          return this.logger.info(
            { update },
            'Got update for sessionId on existent chat',
          );
        }
        this.logger.error(e, 'An error occured during chat update');
      }
    }
  };

  del: BaileysEventHandler<'chats.delete'> = async (ids) => {
    try {
      await this.chatRepository.delete({ id: In(ids) });
    } catch (e) {
      this.logger.error(e, 'An error occured during chats delete');
    }
  };

  listen() {
    if (this.listening) return;

    this.event.on('messaging-history.set', this.set);
    this.event.on('chats.upsert', this.upsert);
    this.event.on('chats.update', this.update);
    this.event.on('chats.delete', this.del);
    this.listening = true;
  }

  unlisten() {
    if (!this.listening) return;

    this.event.off('messaging-history.set', this.set);
    this.event.off('chats.upsert', this.upsert);
    this.event.off('chats.update', this.update);
    this.event.off('chats.delete', this.del);
    this.listening = false;
  }
}
