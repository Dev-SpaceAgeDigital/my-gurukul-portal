import net from 'net';
import tls from 'tls';

type RedisValue = string | number;

class SimpleRedisClient {
  private url: URL;

  constructor(connectionUrl: string) {
    this.url = new URL(connectionUrl);
  }

  async get(key: string) {
    const result = await this.command(['GET', key]);
    return typeof result === 'string' ? result : null;
  }

  async set(key: string, value: RedisValue, options?: { ex?: number; nx?: boolean }) {
    const args = ['SET', key, String(value)];
    if (options?.ex) args.push('EX', String(options.ex));
    if (options?.nx) args.push('NX');
    return this.command(args);
  }

  async del(key: string) {
    return this.command(['DEL', key]);
  }

  async incr(key: string) {
    const result = await this.command(['INCR', key]);
    return typeof result === 'number' ? result : Number(result || 0);
  }

  async expire(key: string, seconds: number) {
    return this.command(['EXPIRE', key, String(seconds)]);
  }

  async ttl(key: string) {
    const result = await this.command(['TTL', key]);
    return typeof result === 'number' ? result : Number(result || 0);
  }

  private command(args: string[]): Promise<any> {
    return new Promise((resolve, reject) => {
      const port = Number(this.url.port || 6379);
      const host = this.url.hostname || '127.0.0.1';
      const socket = this.url.protocol === 'rediss:'
        ? tls.connect({ host, port })
        : net.connect({ host, port });

      let buffer = Buffer.alloc(0);
      let settled = false;

      const cleanup = () => {
        socket.removeAllListeners();
        socket.end();
        socket.destroy();
      };

      socket.setTimeout(3000);

      socket.on('connect', () => {
        const commands: string[][] = [];
        const password = decodeURIComponent(this.url.password || '');
        if (password) commands.push(['AUTH', password]);
        commands.push(args);
        socket.write(commands.map(serializeCommand).join(''));
      });

      socket.on('data', (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);
        try {
          const parsed = parseResponses(buffer, this.url.password ? 2 : 1);
          if (parsed.complete) {
            settled = true;
            cleanup();
            resolve(parsed.values[parsed.values.length - 1]);
          }
        } catch (error) {
          settled = true;
          cleanup();
          reject(error);
        }
      });

      socket.on('timeout', () => {
        if (!settled) {
          settled = true;
          cleanup();
          reject(new Error('Redis command timed out'));
        }
      });

      socket.on('error', (error) => {
        if (!settled) {
          settled = true;
          cleanup();
          reject(error);
        }
      });
    });
  }
}

declare global {
  var _memoryStore: Map<string, { value: string; expiresAt?: number }> | undefined;
}

const memoryStore = global._memoryStore || (global._memoryStore = new Map<string, { value: string; expiresAt?: number }>());

class MemoryRedisClient {
  async get(key: string) {
    const item = memoryStore.get(key);
    if (!item) return null;
    if (item.expiresAt && item.expiresAt <= Date.now()) {
      memoryStore.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: RedisValue, options?: { ex?: number; nx?: boolean }) {
    if (options?.nx && await this.get(key)) return null;
    memoryStore.set(key, {
      value: String(value),
      expiresAt: options?.ex ? Date.now() + options.ex * 1000 : undefined,
    });
    return 'OK';
  }

  async del(key: string) {
    return memoryStore.delete(key) ? 1 : 0;
  }

  async incr(key: string) {
    const current = Number(await this.get(key) || 0) + 1;
    const existing = memoryStore.get(key);
    memoryStore.set(key, { value: String(current), expiresAt: existing?.expiresAt });
    return current;
  }

  async expire(key: string, seconds: number) {
    const item = memoryStore.get(key);
    if (!item) return 0;
    item.expiresAt = Date.now() + seconds * 1000;
    return 1;
  }

  async ttl(key: string) {
    const item = memoryStore.get(key);
    if (!item?.expiresAt) return -1;
    return Math.max(0, Math.ceil((item.expiresAt - Date.now()) / 1000));
  }
}

export const redis = process.env.REDIS_URL
  ? new SimpleRedisClient(process.env.REDIS_URL)
  : new MemoryRedisClient();

function serializeCommand(args: string[]) {
  return `*${args.length}\r\n${args.map((arg) => `$${Buffer.byteLength(arg)}\r\n${arg}\r\n`).join('')}`;
}

function parseResponses(buffer: Buffer, expectedCount: number) {
  const values: any[] = [];
  let offset = 0;

  while (values.length < expectedCount && offset < buffer.length) {
    const parsed = parseValue(buffer, offset);
    if (!parsed) return { complete: false, values };
    values.push(parsed.value);
    offset = parsed.offset;
  }

  return { complete: values.length === expectedCount, values };
}

function parseValue(buffer: Buffer, start: number): { value: any; offset: number } | null {
  const type = String.fromCharCode(buffer[start]);
  const lineEnd = buffer.indexOf('\r\n', start);
  if (lineEnd === -1) return null;
  const line = buffer.subarray(start + 1, lineEnd).toString();
  const offset = lineEnd + 2;

  if (type === '+') return { value: line, offset };
  if (type === '-') throw new Error(line);
  if (type === ':') return { value: Number(line), offset };
  if (type === '$') {
    const length = Number(line);
    if (length === -1) return { value: null, offset };
    const end = offset + length;
    if (buffer.length < end + 2) return null;
    return { value: buffer.subarray(offset, end).toString(), offset: end + 2 };
  }
  throw new Error(`Unsupported Redis response type: ${type}`);
}
