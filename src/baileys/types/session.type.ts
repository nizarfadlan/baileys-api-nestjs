import type { SocketConfig, WASocket } from '@whiskeysockets/baileys';
import { Store } from '@baileys/store';
import { Response } from 'express';

export type Session = WASocket & {
  destroy: (sessionId: string, logout?: boolean) => Promise<void>;
  store: Store;
};

export type createSessionOptions = {
  sessionId: string;
  res?: Response;
  SSE?: boolean;
  readIncomingMessages?: boolean;
  socketConfig?: SocketConfig;
};
