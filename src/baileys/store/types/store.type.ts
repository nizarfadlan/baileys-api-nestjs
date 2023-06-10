import type { BaileysEventMap, SocketConfig } from '@whiskeysockets/baileys';
import type Long from 'long';

export type BaileysEventHandler<T extends keyof BaileysEventMap> = (
  args: BaileysEventMap[T],
) => void;

export type initStoreOptions = {
  logger?: SocketConfig['logger'];
};

type TransformTypeOrm<T, TransformObject> = T extends Long
  ? number
  : T extends Uint8Array
  ? Buffer
  : T extends null
  ? never
  : T extends object
  ? TransformObject extends true
    ? object
    : T
  : T;

export type MakeTransformedTypeOrm<
  T extends Record<string, any>,
  TransformObject extends boolean = true,
> = {
  [K in keyof T]: TransformTypeOrm<T[K], TransformObject>;
};

type SerializeTypeOrm<T> = T extends Buffer
  ? {
      type: 'Buffer';
      data: number[];
    }
  : T extends bigint
  ? string
  : T extends null
  ? never
  : T;

export type MakeSerializedTypeOrm<T extends Record<string, any>> = {
  [K in keyof T]: SerializeTypeOrm<T[K]>;
};
