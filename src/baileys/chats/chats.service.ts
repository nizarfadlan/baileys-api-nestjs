import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatEntity } from './entities/chat.entity';
import { Repository } from 'typeorm';
import {
  Pagination,
  PaginationOptions,
  ResponseWithPagination,
} from 'src/common/dto/pagination.dto';
import { serializeTypeOrm } from '@baileys/store';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(ChatEntity)
    private chatRepository: Repository<ChatEntity>,
  ) {}

  async findAll(
    sessionId: string,
    options: PaginationOptions,
  ): Promise<ResponseWithPagination> {
    const { limit = 10, page = 0, orderColumn, orderMethod = 'asc' } = options;

    const chats = (
      await this.chatRepository.find({
        take: limit,
        skip: page * limit,
        order: orderColumn
          ? { [orderColumn]: orderMethod }
          : { pkId: orderMethod },
        where: {
          sessionId,
        },
      })
    ).map((chat) => serializeTypeOrm(chat));

    if (chats) {
      const chatCount = chats.length;

      const pagination: Pagination = {
        total: chatCount,
        currentPage: page + 1,
        limit,
        nextPage: (page + 1) * limit >= chatCount ? undefined : page + 1,
        prevPage: page == 0 ? undefined : page - 1,
        firstPage: 1,
        lastPage: chatCount ? Math.ceil(chatCount / limit) : undefined,
      };

      return {
        result: chats,
        pagination,
      };
    }

    return undefined;
  }
}
