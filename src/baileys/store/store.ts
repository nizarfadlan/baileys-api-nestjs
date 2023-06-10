import type { BaileysEventEmitter } from '@whiskeysockets/baileys';
import { setLogger } from './shared';
import { initStoreOptions } from './types/store.type';
import { Repository } from 'typeorm';
import { GroupMetaDataHandler } from '@baileys/groups/store/handler';
import { ChatEntity } from '@baileys/chats/entities/chat.entity';
import { ContactEntity } from '@baileys/contacts/entities/contact.entity';
import { MessageEntity } from '@baileys/messages/entities/message.entity';
import { GroupMetaDataEntity } from '@baileys/groups/entities/groupMetaData.entity';
import { ChatHandler } from '@baileys/chats/store/handler';
import { MessageHandler } from '@baileys/messages/store/handler';
import { ContactHandler } from '@baileys/contacts/store/handler';

/** Initialize shared instances that will be consumed by the Store instance */
export function initStore({ logger }: initStoreOptions) {
  setLogger(logger);
}

export class Store {
  private readonly chatHandler;
  private readonly messageHandler;
  private readonly contactHandler;
  private readonly groupMetaDataHandler;

  constructor(
    sessionId: string,
    event: BaileysEventEmitter,
    public chatRepository: Repository<ChatEntity>,
    public contactRepository: Repository<ContactEntity>,
    public messageRepository: Repository<MessageEntity>,
    public groupMetaDataRepository: Repository<GroupMetaDataEntity>,
  ) {
    this.chatHandler = new ChatHandler(sessionId, event, chatRepository);
    this.messageHandler = new MessageHandler(
      sessionId,
      event,
      messageRepository,
      chatRepository,
    );
    this.contactHandler = new ContactHandler(
      sessionId,
      event,
      contactRepository,
    );
    this.groupMetaDataHandler = new GroupMetaDataHandler(
      sessionId,
      event,
      groupMetaDataRepository,
    );
    this.listen();
  }

  /** Start listening to the events */
  public listen() {
    this.chatHandler.listen();
    this.messageHandler.listen();
    this.contactHandler.listen();
    this.groupMetaDataHandler.listen();
  }

  /** Stop listening to the events */
  public unlisten() {
    this.chatHandler.unlisten();
    this.messageHandler.unlisten();
    this.contactHandler.unlisten();
    this.groupMetaDataHandler.unlisten();
  }
}
