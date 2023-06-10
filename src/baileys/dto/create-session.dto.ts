import { SocketConfig } from '@whiskeysockets/baileys';
import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateSessionDto {
  @IsNotEmpty()
  @IsString()
  sessionId: string;

  @IsOptional()
  @IsBoolean()
  readIncomingMessages?: boolean;

  @IsOptional()
  @IsObject()
  socketConfig?: SocketConfig;
}
