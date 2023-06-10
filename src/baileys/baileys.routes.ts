import { ChatsModule } from './chats/chats.module';
import { ContactsModule } from './contacts/contacts.module';
import { GroupsModule } from './groups/groups.module';
import { MessagesModule } from './messages/messages.module';

export const baileysRoutes = [
  {
    path: 'chat',
    module: ChatsModule,
  },
  {
    path: 'contact',
    module: ContactsModule,
  },
  {
    path: 'group',
    module: GroupsModule,
  },
  {
    path: 'message',
    module: MessagesModule,
  },
];
