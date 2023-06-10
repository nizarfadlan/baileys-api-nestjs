import type { WAMessage } from '@whiskeysockets/baileys';
import { IsNotEmptyObject, IsObject } from 'class-validator';

export class DownloadMediaMessageDto {
  @IsObject()
  @IsNotEmptyObject()
  message: WAMessage;
}
