import type {
  AnyMessageContent,
  MiscMessageGenerationOptions,
} from '@whiskeysockets/baileys';
import {
  IsIn,
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class SendMessageDto {
  @IsNotEmpty()
  @IsString()
  jid: string;

  @IsOptional()
  @IsIn(['number', 'group'])
  type?: 'number' | 'group';

  @IsNotEmptyObject()
  @IsObject()
  message: AnyMessageContent;

  @IsOptional()
  @IsObject()
  options?: MiscMessageGenerationOptions;
}
