import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { SendBulkMessageDto } from './dto/send-bulk-message.dto';
import { DownloadMediaMessageDto } from './dto/download-media-message.dto';

@Controller()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get(':sessionId')
  @HttpCode(HttpStatus.OK)
  async findAllMessage(
    @Param('sessionId') sessionId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    const result = await this.messagesService.findAll(sessionId, paginationDto);

    return {
      message: '',
      data: result,
    };
  }

  @Get(':sessionId/list/:jid')
  @HttpCode(HttpStatus.OK)
  async findMessage(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
    @Query() paginationDto: PaginationDto,
  ) {
    const result = await this.messagesService.findMessageJid(
      sessionId,
      jid,
      paginationDto,
    );

    return {
      message: '',
      data: result,
    };
  }

  @Post(':sessionId/send')
  @HttpCode(HttpStatus.OK)
  async send(
    @Param('sessionId') sessionId: string,
    @Body() sendMessageDto: SendMessageDto,
  ) {
    const result = await this.messagesService.send(sessionId, sendMessageDto);

    return {
      message: '',
      data: result,
    };
  }

  @Post(':sessionId/send/bulk')
  @HttpCode(HttpStatus.OK)
  async sendBulk(
    @Param('sessionId') sessionId: string,
    @Body() sendBulkMessageDto: SendBulkMessageDto,
  ) {
    const result = await this.messagesService.sendBulk(
      sessionId,
      sendBulkMessageDto,
    );

    return {
      message: '',
      data: result,
    };
  }

  @Post(':sessionId/download')
  @HttpCode(HttpStatus.OK)
  async download(
    @Param('sessionId') sessionId: string,
    @Body() downloadMediaMessageDto: DownloadMediaMessageDto,
    @Res({ passthrough: true }) res,
  ) {
    const result = await this.messagesService.download(
      sessionId,
      downloadMediaMessageDto,
    );

    res.set({
      'Content-Type': result.content.mimetype!,
    });

    return result.buffer;
  }
}
