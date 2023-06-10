import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { BaileysService } from './baileys.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { Response } from 'express';

@Controller()
export class BaileysController {
  constructor(private readonly baileysService: BaileysService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createSessionDto: CreateSessionDto,
    @Res() res: Response,
  ) {
    const check = this.baileysService.sessionExists(createSessionDto.sessionId);

    if (check) {
      return res.status(HttpStatus.FOUND).json({
        message: 'Session already exists',
        data: null,
      });
    }

    await this.baileysService.createSession({
      ...createSessionDto,
      res,
    });
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll() {
    const result = this.baileysService.allListSessions();

    return {
      message: 'Fetch the data of all session successfully',
      data: result,
    };
  }

  @Get(':sessionId')
  @HttpCode(HttpStatus.OK)
  async find(@Param('sessionId') sessionId: string) {
    const result = this.baileysService.getSession(sessionId);

    return {
      message: 'Fetch the data of one session successfully',
      data: result.user || '',
    };
  }

  @Get(':sessionId/status')
  @HttpCode(HttpStatus.OK)
  async findStatusSession(@Param('sessionId') sessionId: string) {
    const session = this.baileysService.getSession(sessionId);
    const result = this.baileysService.getSessionStatus(session);

    return {
      message: 'Fetch the status of one session successfully',
      data: result,
    };
  }

  @Get(':sessionId/SSE')
  @HttpCode(HttpStatus.OK)
  async addSSE(@Param('sessionId') sessionId: string, @Res() res: Response) {
    const check = this.baileysService.sessionExists(sessionId);

    if (check) {
      return res.status(HttpStatus.FOUND).json({
        message: 'Session already exists',
        data: null,
      });
    }

    await this.baileysService.createSession({
      sessionId,
      res,
      SSE: true,
    });

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
  }

  @Delete(':sessionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('sessionId') sessionId: string) {
    this.baileysService.deleteSession(sessionId);

    return {
      message: 'Delete one session successfully',
    };
  }
}
