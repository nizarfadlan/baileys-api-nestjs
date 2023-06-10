import { SocketConfig } from '@whiskeysockets/baileys';
import { DEFAULT_CONNECTION_CONFIG } from '@whiskeysockets/baileys';

let logger: SocketConfig['logger'] | null = null;

export function setLogger(nestLogger?: SocketConfig['logger']) {
  logger = nestLogger || DEFAULT_CONNECTION_CONFIG.logger;
}

export function useLogger(): SocketConfig['logger'] {
  return logger;
}
