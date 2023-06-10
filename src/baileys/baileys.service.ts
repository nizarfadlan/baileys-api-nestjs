import { Injectable, NotFoundException } from '@nestjs/common';
import { Session, createSessionOptions } from './types/session.type';
import { ConfigService } from '@nestjs/config';
import { Store, initStore, useSession } from './store';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import makeWASocket, {
  Browsers,
  ConnectionState,
  DisconnectReason,
  isJidBroadcast,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';
import type { proto, WASocket } from '@whiskeysockets/baileys';
import type { WebSocket } from 'ws';
import { logger } from 'src/config/logger/pino.logger';
import { delayMs } from './baileys.utils';
import { toDataURL } from 'qrcode';
import { Response } from 'express';
import { Boom } from '@hapi/boom';
import { SessionEntity } from './entities/session.entity';
import { ChatEntity } from './chats/entities/chat.entity';
import { MessageEntity } from './messages/entities/message.entity';
import { ContactEntity } from './contacts/entities/contact.entity';
import { GroupMetaDataEntity } from './groups/entities/groupMetaData.entity';
import {
  MAX_RECONNECT_RETRIES,
  RECONNECT_INTERVAL,
  SSE_MAX_QR_GENERATION,
} from 'src/common/constant';

@Injectable()
export class BaileysService {
  private socket: WASocket;
  private readonly sessions = new Map<string, Session>();
  private readonly retries = new Map<string, number>();
  private readonly SSEQRGenerations = new Map<string, number>();

  private readonly RECONNECT_INTERVAL;
  private readonly MAX_RECONNECT_RETRIES;
  private readonly SSE_MAX_QR_GENERATION;
  private readonly SESSION_CONFIG_ID = 'session-config';

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(SessionEntity)
    public sessionRepository: Repository<SessionEntity>,
    @InjectRepository(ChatEntity)
    public chatRepository: Repository<ChatEntity>,
    @InjectRepository(MessageEntity)
    public messageRepository: Repository<MessageEntity>,
    @InjectRepository(ContactEntity)
    public contactRepository: Repository<ContactEntity>,
    @InjectRepository(GroupMetaDataEntity)
    public groupMetaDataRepository: Repository<GroupMetaDataEntity>,
  ) {
    this.RECONNECT_INTERVAL = RECONNECT_INTERVAL || 0;
    this.MAX_RECONNECT_RETRIES = MAX_RECONNECT_RETRIES || 5;
    this.SSE_MAX_QR_GENERATION = SSE_MAX_QR_GENERATION || 5;

    this.init();
  }

  public init() {
    initStore({ logger });
    (async () => {
      await this.initSessions();
    })();
  }

  public async initSessions(): Promise<void> {
    const sessions = await this.sessionRepository.find({
      select: { sessionId: true, data: true },
      where: { id: Like(`%${this.SESSION_CONFIG_ID}%`) },
    });

    for (const { sessionId, data } of sessions) {
      const { readIncomingMessages, ...socketConfig } = JSON.parse(data);
      this.createSession({ sessionId, readIncomingMessages, socketConfig });
    }
  }

  private shouldReconnect(sessionId: string): boolean {
    let attempts = this.retries.get(sessionId) ?? 0;

    if (attempts < this.MAX_RECONNECT_RETRIES) {
      attempts += 1;
      this.retries.set(sessionId, attempts);
      return true;
    }
    return false;
  }

  public async destroy(sessionId: string, logout = true) {
    try {
      await Promise.all([
        logout && this.socket.logout(),
        this.chatRepository.delete({ sessionId }),
        this.contactRepository.delete({ sessionId }),
        this.messageRepository.delete({ sessionId }),
        this.groupMetaDataRepository.delete({ sessionId }),
        this.sessionRepository.delete({ sessionId }),
      ]);
    } catch (e) {
      logger.error(e, 'An error occured during session destroy');
    } finally {
      this.sessions.delete(sessionId);
    }
  }

  private handleConnectionClose(
    connectionState: Partial<ConnectionState>,
    options: createSessionOptions,
    sessionId: string,
    res: Response,
  ) {
    const code = (connectionState.lastDisconnect?.error as Boom)?.output
      ?.statusCode;
    const restartRequired = code === DisconnectReason.restartRequired;
    const doNotReconnect = !this.shouldReconnect(sessionId);

    if (
      code === DisconnectReason.loggedOut ||
      (doNotReconnect && options.SSE)
    ) {
      if (res) {
        !options.SSE &&
          !res.headersSent &&
          res.status(500).json({ error: 'Unable to create session' });
        res.end();
      }
      this.destroy(sessionId, doNotReconnect);
      return;
    }

    if (!restartRequired) {
      logger.info(
        { attempts: this.retries.get(sessionId) ?? 1, sessionId },
        'Reconnecting...',
      );
    }
    setTimeout(
      () => this.createSession(options),
      restartRequired ? 0 : this.RECONNECT_INTERVAL,
    );
  }

  private async handleNormalConnectionUpdate(
    connectionState: Partial<ConnectionState>,
    sessionId: string,
    res: Response,
  ) {
    if (connectionState.qr?.length) {
      if (res && !res.headersSent) {
        try {
          const qr = await toDataURL(connectionState.qr);
          res.status(200).json({
            message: 'Created session successfully',
            data: qr,
          });
          return;
        } catch (e) {
          logger.error(e, 'An error occured during QR generation');
          res.status(500).json({ error: 'Unable to generate QR' });
        }
      }
      this.destroy(sessionId);
    }
  }

  private async handleSSEConnectionUpdate(
    connectionState: Partial<ConnectionState>,
    sessionId: string,
    res: Response,
  ) {
    let qr: string | undefined = undefined;
    if (connectionState.qr?.length) {
      try {
        qr = await toDataURL(connectionState.qr);
      } catch (e) {
        logger.error(e, 'An error occured during QR generation');
      }
    }

    const currentGenerations = this.SSEQRGenerations.get(sessionId) ?? 0;
    if (
      !res ||
      res.writableEnded ||
      (qr && currentGenerations >= this.SSE_MAX_QR_GENERATION)
    ) {
      res && !res.writableEnded && res.end();
      this.destroy(sessionId);
      return;
    }

    const data = { ...connectionState, qr };
    if (qr) this.SSEQRGenerations.set(sessionId, currentGenerations + 1);
    res.status(200).write({
      message: 'Created session successfully',
      data: JSON.stringify(data),
    });
  }

  private connectionSocket(options: createSessionOptions, state: any) {
    const { sessionId, socketConfig } = options;
    this.socket = makeWASocket({
      printQRInTerminal: true,
      browser: ['Refourma Bot', 'Chrome', '3.0'],
      generateHighQualityLinkPreview: true,
      ...socketConfig,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      logger,
      shouldIgnoreJid: (jid) => isJidBroadcast(jid),
      getMessage: async (key) => {
        const data = await this.messageRepository.findOne({
          where: { remoteJid: key.remoteJid!, id: key.id!, sessionId },
        });
        return (data?.message || undefined) as proto.IMessage | undefined;
      },
    });
  }

  public async createSession(options: createSessionOptions) {
    const {
      sessionId,
      res,
      SSE = false,
      readIncomingMessages = false,
      socketConfig,
    } = options;
    const configID = `${this.SESSION_CONFIG_ID}-${sessionId}`;
    let connectionState: Partial<ConnectionState> = { connection: 'close' };

    const handleConnectionUpdate = async () => {
      SSE
        ? await this.handleSSEConnectionUpdate(connectionState, sessionId, res)
        : await this.handleNormalConnectionUpdate(
            connectionState,
            sessionId,
            res,
          );
    };

    const stateSession = new useSession(sessionId, this.sessionRepository);
    const { state, saveCreds } = await stateSession.getSessionState();
    await this.connectionSocket(options, state);

    const store = new Store(
      sessionId,
      this.socket.ev,
      this.chatRepository,
      this.contactRepository,
      this.messageRepository,
      this.groupMetaDataRepository,
    );
    this.sessions.set(sessionId, {
      ...this.socket,
      destroy: async () => {
        await this.destroy(sessionId);
      },
      store,
    });

    this.socket.ev.on('creds.update', saveCreds);
    await this.socket.ev.on('connection.update', async (update) => {
      connectionState = update;
      const { connection } = update;

      if (connection === 'open') {
        this.retries.delete(sessionId);
        this.SSEQRGenerations.delete(sessionId);
      }
      if (connection === 'close')
        this.handleConnectionClose(connectionState, options, sessionId, res);
      await handleConnectionUpdate();
    });

    if (readIncomingMessages) {
      this.socket.ev.on('messages.upsert', async (m) => {
        const message = m.messages[0];
        if (message.key.fromMe || m.type !== 'notify') return;

        await delayMs(1000);
        await this.socket.readMessages([message.key]);
      });
    }

    await this.sessionRepository.upsert(
      {
        id: configID,
        sessionId,
        data: JSON.stringify({ readIncomingMessages, ...socketConfig }),
      },
      {
        conflictPaths: ['sessionId', 'id'],
      },
    );
  }

  public getSessionStatus(session: Session): string {
    const state = ['CONNECTING', 'CONNECTED', 'DISCONNECTING', 'DISCONNECTED'];
    let status = state[(session.ws as WebSocket).readyState];
    status = session.user ? 'AUTHENTICATED' : status;
    return status;
  }

  public allListSessions() {
    return Array.from(this.sessions.entries()).map(([id, session]) => ({
      id,
      status: this.getSessionStatus(session),
    }));
  }

  public getSession(sessionId: string): Session {
    return this.sessions.get(sessionId);
  }

  public deleteSession(sessionId: string): void {
    this.sessions.get(sessionId)?.destroy(sessionId);
  }

  public sessionExists(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  public async jidExists(
    session: Session,
    jid: string,
    type: 'group' | 'number' = 'number',
  ) {
    try {
      if (type === 'number') {
        const [result] = await session.onWhatsApp(jid);
        return !!result?.exists;
      }

      const groupMeta = await session.groupMetadata(jid);
      return !!groupMeta.id;
    } catch (e) {
      return Promise.reject(e);
    }
  }

  public async getPhotoProfile(
    sessionId: string,
    jid: string,
    type: 'group' | 'number' = 'number',
  ): Promise<string> {
    try {
      const session = this.getSession(sessionId);
      if (!session) throw new NotFoundException('Session does not exists');

      const check = await this.jidExists(session, jid, type);
      if (!check) throw new NotFoundException('RemoteJid does not exists');

      const result = await session.profilePictureUrl(jid, 'image');
      return result;
    } catch (e) {
      throw new NotFoundException(e.message);
    }
  }
}
