import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactEntity } from './entities/contact.entity';
import { BaileysModule } from '@baileys/baileys.module';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ContactEntity]),
    forwardRef(() => BaileysModule),
  ],
  providers: [ContactsService],
  controllers: [ContactsController],
})
export class ContactsModule {}
