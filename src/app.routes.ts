import { BaileysModule } from '@baileys/baileys.module';
import { baileysRoutes } from '@baileys/baileys.routes';
import { Routes } from '@nestjs/core';

export const appRoutes: Routes = [
  {
    path: 'whatsapp',
    module: BaileysModule,
    children: baileysRoutes,
  },
];
