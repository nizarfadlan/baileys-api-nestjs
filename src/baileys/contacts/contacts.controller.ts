import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import {
  PaginationDto,
  ResponseWithPagination,
} from 'src/common/dto/pagination.dto';
import { UpdateBlockDto } from './dto/update-block.dto';

@Controller()
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get(':sessionId')
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Param('sessionId') sessionId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    const result: ResponseWithPagination = await this.contactsService.findAll(
      sessionId,
      paginationDto,
    );

    return {
      message: 'Fetch the data of all contacts successfully',
      data: result,
    };
  }

  @Get(':sessionId/blocklist')
  @HttpCode(HttpStatus.OK)
  async findAllListBlock(@Param('sessionId') sessionId: string) {
    const result = await this.contactsService.listBlocked(sessionId);

    return {
      message: 'Fetch the data of all list block contacts successfully',
      data: result,
    };
  }

  @Patch(':sessionId/blocklist')
  @HttpCode(HttpStatus.OK)
  async updateBlock(
    @Param('sessionId') sessionId: string,
    @Body() updateBlockDto: UpdateBlockDto,
  ) {
    const result = await this.contactsService.updateBlock(
      sessionId,
      updateBlockDto,
    );

    return {
      message: result,
    };
  }

  @Get(':sessionId/check/:jid')
  @HttpCode(HttpStatus.OK)
  async checkJid(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
  ) {
    const result = await this.contactsService.check(sessionId, jid);

    return {
      message: result,
    };
  }

  @Get(':sessionId/profile/:jid')
  @HttpCode(HttpStatus.OK)
  async getPhotoProfile(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
  ) {
    const result = await this.contactsService.getPhotoProfile(sessionId, jid);

    return {
      message: 'Successfully fetch a profile photo',
      data: result,
    };
  }
}
