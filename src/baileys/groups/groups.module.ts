import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupMetaDataEntity } from './entities/groupMetaData.entity';
import { BaileysModule } from '@baileys/baileys.module';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { ContactEntity } from '@baileys/contacts/entities/contact.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([GroupMetaDataEntity, ContactEntity]),
    forwardRef(() => BaileysModule),
  ],
  providers: [GroupsService],
  controllers: [GroupsController],
})
export class GroupsModule {}
