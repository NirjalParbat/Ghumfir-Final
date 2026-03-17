import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { createClient } from 'redis';
import { logAuditEvent } from '../utils/auditLogger.js';

let redisClient;
let limiterCounter = 0;

const normalizeRedisUrl = (raw) => {
  if (!raw || typeof raw !== 'string') return null;

  const trimmed = raw.trim();
  const match = trimmed.match(/rediss?:\/\/\S+/i);
  const candidate = match ? match[0] : trimmed;

  try {
    const parsed = new URL(candidate);

    if (!['redis:', 'rediss:'].includes(parsed.protocol)) {
      return null;
    }

    // Upstash endpoints require TLS. If redis:// was provided, upgrade to rediss://.
    if (parsed.protocol === 'redis:' && parsed.hostname.includes('upstash.io')) {
      parsed.protocol = 'rediss:';
    }

    return parsed.toString();
  } catch {
    return null;
  }
};

const configuredRedisUrl = normalizeRedisUrl(process.env.REDIS_URL);

if (configuredRedisUrl) {
  try {
    const parsed = new URL(configuredRedisUrl);

    redisClient = createClient({
      url: configuredRedisUrl,
      socket: {
        tls: parsed.protocol === 'rediss:',
        reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
      },
    });

    redisClient.on('error', (err) => {
      logAuditEvent('security.ratelimit.redis_error', { message: err?.message }, 'warn');
    });

    redisClient.on('ready', () => {
      logAuditEvent('security.ratelimit.redis_ready', {});
    });

    redisClient.connect().catch((err) => {
      logAuditEvent('security.ratelimit.redis_unavailable', { message: err?.message }, 'warn');
      redisClient = undefined;
    });
  } catch (err) {
    redisClient = undefined;
    logAuditEvent('security.ratelimit.redis_invalid_config', { message: err?.message }, 'warn');
  }
} else if (process.env.REDIS_URL) {
  logAuditEvent('security.ratelimit.redis_invalid_config', { message: 'Invalid REDIS_URL format' }, 'warn');
}

export const createRateLimiter = (options) => {
  const limiterId = ++limiterCounter;
  const store = redisClient
    ? new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
        prefix: `ghumfir:ratelimit:${limiterId}:`,
      })
    : undefined;

  return rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    passOnStoreError: true,
    ...options,
    ...(store ? { store } : {}),
  });
};
