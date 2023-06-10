import { toNumber } from '@whiskeysockets/baileys';
import type {
  MakeTransformedTypeOrm,
  MakeSerializedTypeOrm,
} from './types/store.type';

export class Long {
  low: number;
  high: number;
  unsigned: boolean;

  constructor(low: number, high: number, unsigned?: boolean) {
    this.low = low | 0;
    this.high = high | 0;
    this.unsigned = !!unsigned;
  }

  static isLong(value: any): value is Long {
    return (
      typeof value === 'object' &&
      typeof value.low === 'number' &&
      typeof value.high === 'number' &&
      typeof value.unsigned === 'boolean'
    );
  }
}

export function transformTypeOrm<T extends Record<string, any>>(
  data: T,
  removeNullable = true,
): MakeTransformedTypeOrm<T> {
  const obj = { ...data } as any;

  for (const [key, val] of Object.entries(obj)) {
    if (val !== null && typeof val !== 'undefined') {
      if (typeof val === 'number' || Long.isLong(val)) {
        obj[key] = toNumber(val);
      } else if (typeof val === 'bigint') {
        obj[key] = Number(val);
      } else if (val instanceof Uint8Array) {
        obj[key] = Buffer.from(val);
      }
    } else if (removeNullable) {
      delete obj[key];
    }
  }

  return obj;
}

export function serializeTypeOrm<T extends Record<string, any>>(
  data: T,
  removeNullable = true,
): MakeSerializedTypeOrm<T> {
  const obj = { ...data } as any;

  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'bigint') {
      obj[key] = val.toString();
    } else if (val instanceof Buffer) {
      obj[key] = val.toJSON();
    } else if (removeNullable && (typeof val === 'undefined' || val === null)) {
      delete obj[key];
    }
  }

  return obj;
}
