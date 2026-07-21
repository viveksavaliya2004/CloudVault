const Redis = require('ioredis');

// In-memory fallback cache for environments where Redis server is not running
class MemoryCacheFallback {
  constructor() {
    this.store = new Map();
  }

  async get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expireAt && Date.now() > item.expireAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key, value, mode, seconds) {
    let expireAt = null;
    if (mode === 'EX' && seconds) {
      expireAt = Date.now() + seconds * 1000;
    }
    this.store.set(key, { value, expireAt });
    return 'OK';
  }

  async del(...keys) {
    let count = 0;
    for (const key of keys) {
      if (this.store.delete(key)) count++;
    }
    return count;
  }

  async keys(pattern) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    const matchedKeys = [];
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        matchedKeys.push(key);
      }
    }
    return matchedKeys;
  }
}

let redisClient;
let isRedisConnected = false;
const fallbackStore = new MemoryCacheFallback();

const host = process.env.REDIS_HOST || '127.0.0.1';
const port = process.env.REDIS_PORT || 6379;

try {
  redisClient = new Redis({
    host,
    port,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null, // Don't loop endlessly if Redis server isn't running
  });

  redisClient.on('connect', () => {
    isRedisConnected = true;
    console.log(`[Redis] Successfully connected to Redis server at ${host}:${port}`);
  });

  redisClient.on('error', (err) => {
    if (isRedisConnected) {
      console.warn(`[Redis Error] ${err.message}`);
    }
    isRedisConnected = false;
  });

  // Attempt initial lazy connection asynchronously
  redisClient.connect().catch(() => {
    isRedisConnected = false;
    console.warn(`[Redis] Local Redis server not detected at ${host}:${port}. Operating with resilient memory cache fallback.`);
  });
} catch (err) {
  isRedisConnected = false;
  console.warn(`[Redis] Operating with resilient memory cache fallback.`);
}

// Resilient unified cache interface
const getCache = async (key) => {
  try {
    let result;
    if (isRedisConnected && redisClient) {
      result = await redisClient.get(key);
    } else {
      result = await fallbackStore.get(key);
    }
    return result;
  } catch (err) {
    return await fallbackStore.get(key);
  }
};

const setCache = async (key, data, ttlSeconds = 300) => {
  try {
    const stringData = typeof data === 'string' ? data : JSON.stringify(data);
    if (isRedisConnected && redisClient) {
      await redisClient.set(key, stringData, 'EX', ttlSeconds);
    } else {
      await fallbackStore.set(key, stringData, 'EX', ttlSeconds);
    }
  } catch (err) {
    const stringData = typeof data === 'string' ? data : JSON.stringify(data);
    await fallbackStore.set(key, stringData, 'EX', ttlSeconds);
  }
};

const delCache = async (key) => {
  try {
    if (isRedisConnected && redisClient) {
      await redisClient.del(key);
    }
    await fallbackStore.del(key);
  } catch (err) {
    await fallbackStore.del(key);
  }
};

const delPattern = async (pattern) => {
  try {
    if (isRedisConnected && redisClient) {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    }
    const memKeys = await fallbackStore.keys(pattern);
    if (memKeys.length > 0) {
      await fallbackStore.del(...memKeys);
    }
  } catch (err) {
    const memKeys = await fallbackStore.keys(pattern);
    if (memKeys.length > 0) {
      await fallbackStore.del(...memKeys);
    }
  }
};

module.exports = {
  redisClient,
  getCache,
  setCache,
  delCache,
  delPattern,
};
