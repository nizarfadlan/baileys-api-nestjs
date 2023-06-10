import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import {
  PaginationDto,
  ResponseWithPagination,
} from 'src/common/dto/pagination.dto';

@Controller()
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get(':sessionId')
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Param('sessionId') sessionId,
    @Query() paginationDto: PaginationDto,
  ) {
    const result: ResponseWithPagination = await this.groupsService.findAll(
      sessionId,
      paginationDto,
    );

    return {
      message: '',
      data: result,
    };
  }

  @Get(':sessionId/find/:jid')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
  ) {
    const result = await this.groupsService.findOne(sessionId, jid);

    return {
      message: '',
      data: result,
    };
  }

  @Get(':sessionId/profile/:jid')
  @HttpCode(HttpStatus.OK)
  async getPhotoProfile(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
  ) {
    const result = await this.groupsService.getPhotoProfile(sessionId, jid);

    return {
      message: '',
      data: result,
    };
  }
}
