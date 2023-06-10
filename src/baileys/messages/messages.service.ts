import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageEntity } from './entities/message.entity';
import { Repository } from 'typeorm';
import {
  Pagination,
  PaginationOptions,
  ResponseWithPagination,
} from 'src/common/dto/pagination.dto';
import { serializeTypeOrm } from '@baileys/store';
import { SendMessageDto } from './dto/send-message.dto';
import { BaileysService } from '@baileys/baileys.service';
import { SendBulkMessageDto } from './dto/send-bulk-message.dto';
import type { proto, WAGenericMediaMessage } from '@whiskeysockets/baileys';
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { delayMs } from '@baileys/baileys.utils';
import { DownloadMediaMessageDto } from './dto/download-media-message.dto';
import { logger } from 'src/config/logger/pino.logger';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(MessageEntity)
    private messageRepository: Repository<MessageEntity>,
    private baileysService: BaileysService,
  ) {}

  async findAll(
    sessionId: string,
    options: PaginationOptions,
  ): Promise<ResponseWithPagination> {
    const { limit = 10, page = 0 } = options;

    const messages = (
      await this.messageRepository.find({
        take: limit,
        skip: page * limit,
        where: { sessionId },
      })
    ).map((message) => serializeTypeOrm(message));

    if (messages) {
      const messageCount = messages.length;

      const pagination: Pagination = {
        total: messageCount,
        currentPage: page + 1,
        limit,
        nextPage: (page + 1) * limit >= messageCount ? undefined : page + 1,
        prevPage: page == 0 ? undefined : page - 1,
        firstPage: 1,
        lastPage: messageCount ? Math.ceil(messageCount / limit) : undefined,
      };

      return {
        result: messages,
        pagination,
      };
    }

    return undefined;
  }

  async findMessageJid(
    sessionId: string,
    jid: string,
    options: PaginationOptions,
  ): Promise<ResponseWithPagination> {
    const { limit = 10, page = 0 } = options;

    const messages = (
      await this.messageRepository.find({
        take: limit,
        skip: page * limit,
        where: { sessionId, remoteJid: jid },
        order: { messageTimestamp: 'desc' },
      })
    ).map((message) => serializeTypeOrm(message));

    if (messages) {
      const messageCount = messages.length;

      const pagination: Pagination = {
        total: messageCount,
        currentPage: page + 1,
        limit,
        nextPage: (page + 1) * limit >= messageCount ? undefined : page + 1,
        prevPage: page == 0 ? undefined : page - 1,
        firstPage: 1,
        lastPage: messageCount ? Math.ceil(messageCount / limit) : undefined,
      };

      return {
        result: messages,
        pagination,
      };
    }

    return undefined;
  }

  async send(sessionId: string, sendMessageDto: SendMessageDto) {
    try {
      const { jid, type = 'number', message, options } = sendMessageDto;

      const session = this.baileysService.getSession(sessionId);
      const jidExists = this.baileysService.jidExists(session, jid, type);

      if (!jidExists) throw new NotFoundException('JID does not exists');

      const result = await session.sendMessage(jid, message, options);

      return result;
    } catch (e) {
      const message = 'An error occured during message send';
      logger.error(e, message);
      throw new InternalServerErrorException(message);
    }
  }

  async sendBulk(sessionId: string, sendBulkMessageDto: SendBulkMessageDto) {
    const { messages } = sendBulkMessageDto;
    const session = this.baileysService.getSession(sessionId);
    const success: {
      index: number;
      result: proto.WebMessageInfo | undefined;
    }[] = [];
    const errors: { index: number; error: string }[] = [];

    for (const [
      index,
      { jid, type = 'number', delay = 1000, message, options },
    ] of messages.entries()) {
      try {
        const jidExists = this.baileysService.jidExists(session, jid, type);

        if (!jidExists) {
          errors.push({ index, error: 'JID does not exists' });
          continue;
        }

        if (index > 0) await delayMs(delay);
        const result = await session.sendMessage(jid, message, options);
        success.push({ index, result });
      } catch (e) {
        const message = 'An error occured during message send';
        logger.error(e, message);
        errors.push({ index, error: message });
      }
    }

    if (messages.length !== 0 && errors.length === messages.length)
      throw new InternalServerErrorException({ success, errors });

    return { success, errors };
  }

  async download(
    sessionId: string,
    downloadMediaMessageDto: DownloadMediaMessageDto,
  ) {
    try {
      const { message } = downloadMediaMessageDto;

      const session = this.baileysService.getSession(sessionId);
      const type = Object.keys(message.message!)[0] as keyof proto.IMessage;
      const content = message.message![type] as WAGenericMediaMessage;

      const buffer = await downloadMediaMessage(
        message,
        'buffer',
        {},
        { logger, reuploadRequest: session.updateMediaMessage },
      );

      return {
        content,
        buffer,
      };
    } catch (e) {
      const message = 'An error occured during message media download';
      logger.error(e, message);
      throw new InternalServerErrorException(message);
    }
  }
}
