import type {
  AuthenticationCreds,
  SignalDataTypeMap,
} from '@whiskeysockets/baileys';
import { proto, BufferJSON, initAuthCreds } from '@whiskeysockets/baileys';
import { useLogger } from './shared';
import { QueryFailedError, Repository } from 'typeorm';
import { SessionEntity } from '@baileys/entities/session.entity';

interface SessionState {
  state: {
    creds: AuthenticationCreds;
    keys: {
      get: (
        type: keyof SignalDataTypeMap,
        ids: string[],
      ) => Promise<{ [key: string]: SignalDataTypeMap[typeof type] }>;
      set: (data: any) => Promise<void>;
    };
  };
  saveCreds: () => Promise<void>;
}

export class useSession {
  private sessionId;
  private logger = useLogger();

  constructor(
    sessionId: string,
    private sessionRepository: Repository<SessionEntity>,
  ) {
    this.sessionId = sessionId;
  }

  private fixId(id: string): string {
    return id.replace(/\//g, '__').replace(/:/g, '-');
  }

  async write(data: any, id: string): Promise<void> {
    try {
      data = JSON.stringify(data, BufferJSON.replacer);
      id = this.fixId(id);
      await this.sessionRepository.upsert(
        { data, id, sessionId: this.sessionId },
        {
          conflictPaths: ['sessionId', 'id'],
        },
      );
    } catch (e) {
      this.logger.error(e, 'An error occured during session write');
    }
  }

  async read(id: string): Promise<AuthenticationCreds> {
    try {
      const session = await this.sessionRepository.findOne({
        select: ['data'],
        where: {
          id: this.fixId(id),
          sessionId: this.sessionId,
        },
      });

      return session ? JSON.parse(session.data, BufferJSON.reviver) : undefined;
    } catch (e) {
      if (e instanceof QueryFailedError) {
        this.logger.info({ id }, 'Trying to read non existent session data');
      } else {
        this.logger.error(e, 'An error occured during session read');
      }
      return null;
    }
  }

  async del(id: string): Promise<void> {
    try {
      await this.sessionRepository.delete({
        id: this.fixId(id),
        sessionId: this.sessionId,
      });
    } catch (e) {
      this.logger.error(e, 'An error occured during session delete');
    }
  }

  public async getSessionState(): Promise<SessionState> {
    const creds: AuthenticationCreds =
      (await this.read('creds')) || initAuthCreds();

    return {
      state: {
        creds,
        keys: {
          get: async (type: keyof SignalDataTypeMap, ids: string[]) => {
            return this.getKeys(type, ids);
          },
          set: async (data: any) => {
            this.setKeys(data);
          },
        },
      },
      saveCreds: () => this.write(creds, 'creds'),
    };
  }

  private async getKeys(type: keyof SignalDataTypeMap, ids: string[]) {
    const data: { [key: string]: SignalDataTypeMap[typeof type] } = {};
    let value;

    await Promise.all(
      ids.map(async (id) => {
        value = await this.read(`${type}-${id}`);
        if (type === 'app-state-sync-key' && value) {
          value = proto.Message.AppStateSyncKeyData.fromObject(value);
        }
        data[id] = value;
      }),
    );
    return data;
  }

  private async setKeys(data: any) {
    const tasks: Promise<void>[] = [];

    for (const category in data) {
      for (const id in data[category]) {
        const value = data[category][id];
        const sId = `${category}-${id}`;
        tasks.push(value ? this.write(value, sId) : this.del(sId));
      }
    }
    await Promise.all(tasks);
  }
}
