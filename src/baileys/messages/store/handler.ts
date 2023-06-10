import type {
  BaileysEventEmitter,
  MessageUserReceipt,
  proto,
  WAMessageKey,
} from '@whiskeysockets/baileys';
import { jidNormalizedUser, toNumber } from '@whiskeysockets/baileys';
import type { BaileysEventHandler } from '@baileys/store/types/store.type';
import { useLogger } from '@baileys/store/shared';
import { In, Repository } from 'typeorm';
import { transformTypeOrm } from '@baileys/store/utils';
import { MessageEntity } from '../entities/message.entity';
import { ChatEntity } from '@baileys/chats/entities/chat.entity';

export class MessageHandler {
  private listening = false;
  private readonly logger = useLogger();
  private readonly sessionId;
  private event;

  constructor(
    sessionId: string,
    event: BaileysEventEmitter,
    private messageRepository: Repository<MessageEntity>,
    private chatRespository: Repository<ChatEntity>,
  ) {
    this.sessionId = sessionId;
    this.event = event;
    this.listen = this.listen.bind(this);
    this.unlisten = this.unlisten.bind(this);
  }

  set: BaileysEventHandler<'messaging-history.set'> = async ({
    messages,
    isLatest,
  }) => {
    try {
      if (isLatest)
        await this.messageRepository.delete({ sessionId: In(this.sessionId) });

      const messagesToAdd = messages.map((message) => ({
        ...transformTypeOrm(message),
        remoteJid: message.key.remoteJid!,
        id: message.key.id!,
        sessionId: this.sessionId,
      }));

      console.log(messagesToAdd);

      const addedMessages = this.messageRepository.create(messagesToAdd);
      await this.messageRepository.insert(addedMessages);

      this.logger.info({ messages: addedMessages.length }, 'Synced messages');
    } catch (e) {
      this.logger.error(e, 'An error occured during messages set');
    }
  };

  upsert: BaileysEventHandler<'messages.upsert'> = async ({
    messages,
    type,
  }) => {
    switch (type) {
      case 'append':
      case 'notify':
        for (const message of messages) {
          try {
            const jid = jidNormalizedUser(message.key.remoteJid!);
            const data = transformTypeOrm(message);
            await this.messageRepository.upsert(
              {
                ...data,
                remoteJid: jid,
                id: message.key.id!,
                sessionId: this.sessionId,
              },
              {
                skipUpdateIfNoValuesChanged: true,
                conflictPaths: ['sessionId', 'remoteJid', 'id'],
              },
            );

            const [chatResult, chatCount] =
              await this.chatRespository.findAndCount({
                where: {
                  id: jid,
                  sessionId: this.sessionId,
                },
              });
            const chatExists = chatCount > 0;

            if (type === 'notify' && !chatExists) {
              this.event.emit('chats.upsert', [
                {
                  id: jid,
                  conversationTimestamp: toNumber(message.messageTimestamp),
                  unreadCount: 1,
                },
              ]);
            }
          } catch (e) {
            this.logger.error(e, 'An error occured during message upsert');
          }
        }
        break;
    }
  };

  update: BaileysEventHandler<'messages.update'> = async (updates) => {
    for (const { update, key } of updates) {
      try {
        const prevMessage = await this.messageRepository.findOne({
          where: {
            id: key.id!,
            remoteJid: key.remoteJid!,
            sessionId: this.sessionId,
          },
          order: { id: 'DESC' },
        });

        if (!prevMessage) {
          return this.logger.info(
            { update },
            'Got update for non existent message',
          );
        }

        const data = { ...prevMessage, ...update } as proto.IWebMessageInfo;
        await this.messageRepository.delete({
          id: key.id!,
          remoteJid: key.remoteJid!,
          sessionId: this.sessionId,
        });

        const addedMessage = await this.messageRepository.create({
          ...transformTypeOrm(data),
          id: key.id!,
          remoteJid: key.remoteJid!,
          sessionId: this.sessionId,
        });
        await this.messageRepository.insert(addedMessage);
      } catch (e) {
        this.logger.error(e, 'An error occured during message update');
      }
    }
  };

  del: BaileysEventHandler<'messages.delete'> = async (items) => {
    try {
      if ('all' in items) {
        await this.messageRepository.delete({
          remoteJid: items.jid,
          sessionId: this.sessionId,
        });
        return;
      }

      const jid = items.keys[0].remoteJid!;
      await this.messageRepository.delete({
        id: In(items.keys.map((item) => item.id!)),
        remoteJid: jid,
        sessionId: this.sessionId,
      });
    } catch (e) {
      this.logger.error(e, 'An error occured during message delete');
    }
  };

  updateReceipt: BaileysEventHandler<'message-receipt.update'> = async (
    updates,
  ) => {
    for (const { key, receipt } of updates) {
      try {
        const prevMessage = await this.messageRepository.findOne({
          select: ['userReceipt'],
          where: {
            id: key.id!,
            remoteJid: key.remoteJid!,
            sessionId: this.sessionId,
          },
          order: { id: 'DESC' },
        });

        if (!prevMessage) {
          return this.logger.debug(
            { receipt },
            'Got receipt update for non existent message',
          );
        }

        let userReceipt = (prevMessage.userReceipt ||
          []) as unknown as MessageUserReceipt[];
        const recepient = userReceipt.find(
          (m) => m.userJid === receipt.userJid,
        );

        if (recepient) {
          userReceipt = [
            ...userReceipt.filter((m) => m.userJid !== receipt.userJid),
            receipt,
          ];
        } else {
          userReceipt.push(receipt);
        }

        const data = transformTypeOrm({ userReceipt: userReceipt });
        await this.messageRepository.update(
          {
            id: key.id!,
            remoteJid: key.remoteJid!,
            sessionId: this.sessionId,
          },
          {
            ...data,
          },
        );
      } catch (e) {
        this.logger.error(e, 'An error occured during message receipt update');
      }
    }
  };

  updateReaction: BaileysEventHandler<'messages.reaction'> = async (
    reactions,
  ) => {
    for (const { key, reaction } of reactions) {
      try {
        const prevMessage = await this.messageRepository.findOne({
          select: ['userReceipt'],
          where: {
            id: key.id!,
            remoteJid: key.remoteJid!,
            sessionId: this.sessionId,
          },
          order: { id: 'DESC' },
        });

        if (!prevMessage) {
          return this.logger.debug(
            { reaction },
            'Got reaction update for non existent message',
          );
        }

        const authorID = this.getKeyAuthor(reaction.key);
        const reactions = (
          (prevMessage.reactions || []) as proto.IReaction[]
        ).filter((r) => this.getKeyAuthor(r.key) !== authorID);

        if (reaction.text) reactions.push(reaction);
        const data = transformTypeOrm({ reactions: reaction });
        await this.messageRepository.update(
          {
            id: key.id!,
            remoteJid: key.remoteJid!,
            sessionId: this.sessionId,
          },
          {
            ...data,
          },
        );
      } catch (e) {
        this.logger.error(e, 'An error occured during message reaction update');
      }
    }
  };

  private getKeyAuthor(key: WAMessageKey | undefined | null) {
    return (key?.fromMe ? 'me' : key?.participant || key?.remoteJid) || '';
  }

  listen() {
    if (this.listening) return;

    this.event.on('messaging-history.set', this.set);
    this.event.on('messages.upsert', this.upsert);
    this.event.on('messages.update', this.update);
    this.event.on('messages.delete', this.del);
    this.event.on('message-receipt.update', this.updateReceipt);
    this.event.on('messages.reaction', this.updateReaction);
    this.listening = true;
  }

  unlisten() {
    if (!this.listening) return;

    this.event.off('messaging-history.set', this.set);
    this.event.off('messages.upsert', this.upsert);
    this.event.off('messages.update', this.update);
    this.event.off('messages.delete', this.del);
    this.event.off('message-receipt.update', this.updateReceipt);
    this.event.off('messages.reaction', this.updateReaction);
    this.listening = false;
  }
}
