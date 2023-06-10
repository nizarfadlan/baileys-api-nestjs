import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatEntity } from './entities/chat.entity';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ChatEntity])],
  providers: [ChatsService],
  controllers: [ChatsController],
})
export class ChatsModule {}
