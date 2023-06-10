import pino from 'pino';
import pretty from 'pino-pretty';
import { LOG_LEVEL } from 'src/common/constant';

export const logger = pino(
  {
    name: 'Baileys',
    level: process.env.NODE_ENV === 'production' ? LOG_LEVEL : 'debug',
  },
  pretty({ sync: true }),
);
