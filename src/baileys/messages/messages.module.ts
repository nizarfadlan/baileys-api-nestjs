import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageEntity } from './entities/message.entity';
import { BaileysModule } from '@baileys/baileys.module';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([MessageEntity]),
    forwardRef(() => BaileysModule),
  ],
  providers: [MessagesService],
  controllers: [MessagesController],
})
export class MessagesModule {}
