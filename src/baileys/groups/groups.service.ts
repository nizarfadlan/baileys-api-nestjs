import { BaileysService } from '@baileys/baileys.service';
import { ContactEntity } from '@baileys/contacts/entities/contact.entity';
import { serializeTypeOrm } from '@baileys/store';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Pagination,
  PaginationOptions,
  ResponseWithPagination,
} from 'src/common/dto/pagination.dto';
import { Like, Repository } from 'typeorm';
import { GroupMetaDataEntity } from './entities/groupMetaData.entity';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(ContactEntity)
    private contactRepository: Repository<ContactEntity>,
    @InjectRepository(GroupMetaDataEntity)
    private groupMetaDataRepository: Repository<GroupMetaDataEntity>,
    private baileysService: BaileysService,
  ) {}

  async findAll(
    sessionId: string,
    options: PaginationOptions,
  ): Promise<ResponseWithPagination> {
    const { limit = 10, page = 0, orderColumn, orderMethod = 'asc' } = options;

    const groups = (
      await this.contactRepository.find({
        take: limit,
        skip: page * limit,
        order: orderColumn
          ? { [orderColumn]: orderMethod }
          : { pkId: orderMethod },
        where: {
          id: Like('g.us'),
          sessionId,
        },
      })
    ).map((group) => serializeTypeOrm(group));

    if (groups) {
      const groupCount = groups.length;

      const pagination: Pagination = {
        total: groupCount,
        currentPage: page + 1,
        limit,
        nextPage: (page + 1) * limit >= groupCount ? undefined : page + 1,
        prevPage: page == 0 ? undefined : page - 1,
        firstPage: 1,
        lastPage: groupCount ? Math.ceil(groupCount / limit) : undefined,
      };

      return {
        result: groups,
        pagination,
      };
    }

    return undefined;
  }

  async findOne(sessionId: string, jid: string) {
    const checkLocal = await this.groupMetaDataRepository.findOne({
      where: {
        id: jid,
        sessionId,
      },
    });

    if (!checkLocal) {
      const session = this.baileysService.getSession(sessionId);
      if (!session) throw new NotFoundException('Session does not exists');

      const data = await session.groupMetadata(jid);

      if (data) return data;

      throw new NotFoundException('RemoteJid does not exists');
    }

    const data = serializeTypeOrm(checkLocal);
    return data;
  }

  async getPhotoProfile(sessionId: string, jid: string): Promise<string> {
    return this.baileysService.getPhotoProfile(sessionId, jid, 'group');
  }
}
