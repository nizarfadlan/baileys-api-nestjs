import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ContactEntity } from './entities/contact.entity';
import { Like, Repository } from 'typeorm';
import {
  Pagination,
  PaginationOptions,
  ResponseWithPagination,
} from 'src/common/dto/pagination.dto';
import { serializeTypeOrm } from '@baileys/store';
import { BaileysService } from '@baileys/baileys.service';
import { UpdateBlockDto } from './dto/update-block.dto';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(ContactEntity)
    private contactRepository: Repository<ContactEntity>,
    private baileysService: BaileysService,
  ) {}

  async findAll(
    sessionId: string,
    options: PaginationOptions,
  ): Promise<ResponseWithPagination> {
    const { limit = 10, page = 0, orderColumn, orderMethod = 'asc' } = options;

    const contacts = (
      await this.contactRepository.find({
        take: limit,
        skip: page * limit,
        order: orderColumn
          ? { [orderColumn]: orderMethod }
          : { pkId: orderMethod },
        where: {
          id: Like('s.whatsapp.net'),
          sessionId,
        },
      })
    ).map((contact) => serializeTypeOrm(contact));

    if (contacts) {
      const contactCount = contacts.length;

      const pagination: Pagination = {
        total: contactCount,
        currentPage: page + 1,
        limit,
        nextPage: (page + 1) * limit >= contactCount ? undefined : page + 1,
        prevPage: page == 0 ? undefined : page - 1,
        firstPage: 1,
        lastPage: contactCount ? Math.ceil(contactCount / limit) : undefined,
      };

      return {
        result: contacts,
        pagination,
      };
    }

    return undefined;
  }

  async listBlocked(sessionId: string) {
    const session = this.baileysService.getSession(sessionId);
    const result = await session.fetchBlocklist();

    if (result) return result;

    return undefined;
  }

  async updateBlock(
    sessionId: string,
    updateBlockDto: UpdateBlockDto,
  ): Promise<string> {
    const { jid, action } = updateBlockDto;
    const session = this.baileysService.getSession(sessionId);
    if (!session) throw new NotFoundException('Session does not exists');

    const check = await this.baileysService.jidExists(session, jid);
    if (!check) throw new NotFoundException('RemoteJid does not exists');

    await session.updateBlockStatus(jid, action);

    return `Successfully contact ${action}ed`;
  }

  async check(sessionId: string, jid: string): Promise<string> {
    const session = this.baileysService.getSession(sessionId);
    if (!session) throw new NotFoundException('Session does not exists');

    const check = await this.baileysService.jidExists(session, jid);
    if (!check) throw new NotFoundException('RemoteJid does not exists');

    return check ? 'RemoteJid found' : 'RemoteJid not found';
  }

  async getPhotoProfile(sessionId: string, jid: string): Promise<string> {
    return this.baileysService.getPhotoProfile(sessionId, jid, 'number');
  }
}
