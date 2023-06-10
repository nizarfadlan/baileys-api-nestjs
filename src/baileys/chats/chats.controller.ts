import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { ChatsService } from './chats.service';
import {
  PaginationDto,
  ResponseWithPagination,
} from 'src/common/dto/pagination.dto';

@Controller()
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Get(':sessionId')
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Req() req,
    @Param('sessionId') sessionId,
    @Query() paginationDto: PaginationDto,
  ) {
    const result: ResponseWithPagination = await this.chatsService.findAll(
      sessionId,
      paginationDto,
    );

    return {
      message: 'Fetch the data of all chats successfully',
      data: result,
    };
  }
}
