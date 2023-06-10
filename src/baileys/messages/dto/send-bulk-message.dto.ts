import { PartialType } from '@nestjs/mapped-types';
import { SendMessageDto } from './send-message.dto';
import { IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SendBulkMessage extends PartialType(SendMessageDto) {
  @IsNumber()
  @IsOptional()
  delay?: number;
}

export class SendBulkMessageDto {
  @ValidateNested({ each: true })
  @Type(() => SendBulkMessage)
  messages: SendBulkMessage[];
}
