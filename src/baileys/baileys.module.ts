import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaileysService } from './baileys.service';
import { BaileysController } from './baileys.controller';
import { ChatsModule } from './chats/chats.module';
import { ContactsModule } from './contacts/contacts.module';
import { ChatEntity } from './chats/entities/chat.entity';
import { ContactEntity } from './contacts/entities/contact.entity';
import { GroupMetaDataEntity } from './groups/entities/groupMetaData.entity';
import { MessageEntity } from './messages/entities/message.entity';
import { SessionEntity } from './entities/session.entity';
import { GroupsModule } from './groups/groups.module';
import { MessagesModule } from './messages/messages.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChatEntity,
      ContactEntity,
      GroupMetaDataEntity,
      MessageEntity,
      SessionEntity,
    ]),
    forwardRef(() => ChatsModule),
    forwardRef(() => ContactsModule),
    forwardRef(() => GroupsModule),
    forwardRef(() => MessagesModule),
  ],
  providers: [BaileysService],
  controllers: [BaileysController],
  exports: [BaileysService],
})
export class BaileysModule {}
