const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');

const host = process.env.REDIS_HOST || '127.0.0.1';
const port = process.env.REDIS_PORT || 6379;

let redisConnection = null;
let fileQueue = null;
let isBullMQActive = false;

// Custom in-memory fallback queue handler for when Redis server is offline
class MemoryQueueFallback {
  constructor() {
    this.jobs = [];
    this.processor = null;
  }

  setProcessor(processorFn) {
    this.processor = processorFn;
  }

  async add(jobName, data, options = {}) {
    const job = {
      id: `mem-job-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: jobName,
      data,
      attemptsMade: 0,
      opts: { attempts: options.attempts || 3 }
    };
    this.jobs.push(job);

    // Asynchronously process in background memory
    setImmediate(() => this.processNext());
    return job;
  }

  async processNext() {
    if (!this.processor || this.jobs.length === 0) return;
    const job = this.jobs.shift();
    
    let success = false;
    while (job.attemptsMade < job.opts.attempts && !success) {
      try {
        job.attemptsMade++;
        console.log(`⚙️ [Background Worker] Processing job "${job.name}" (ID: ${job.id}, Attempt: ${job.attemptsMade})`);
        await this.processor(job);
        success = true;
        console.log(`✅ [Background Worker] Job "${job.name}" (ID: ${job.id}) completed successfully.`);
      } catch (err) {
        console.warn(`⚠️ [Background Worker Retry] Job "${job.name}" (ID: ${job.id}) failed attempt ${job.attemptsMade}: ${err.message}`);
        if (job.attemptsMade >= job.opts.attempts) {
          console.error(`❌ [Background Worker] Job "${job.name}" (ID: ${job.id}) failed permanently after ${job.attemptsMade} attempts.`);
        }
      }
    }
  }
}

const memoryQueue = new MemoryQueueFallback();

try {
  redisConnection = new Redis({
    host,
    port,
    lazyConnect: true,
    maxRetriesPerRequest: null,
    retryStrategy: () => null,
  });

  redisConnection.on('connect', () => {
    isBullMQActive = true;
    console.log(`[BullMQ] Connected to Redis queue at ${host}:${port}`);
  });

  redisConnection.on('error', () => {
    isBullMQActive = false;
  });

  redisConnection.connect().then(() => {
    fileQueue = new Queue('file-processing-queue', { connection: redisConnection });
    isBullMQActive = true;
  }).catch(() => {
    isBullMQActive = false;
    if (redisConnection) {
      try { redisConnection.disconnect(); } catch (e) {}
    }
    console.warn(`[BullMQ] Redis server offline at ${host}:${port}. Operating with resilient memory queue worker.`);
  });
} catch (err) {
  isBullMQActive = false;
}

const addFileProcessingJob = async (jobName, data, options = {}) => {
  const defaultOpts = {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    ...options
  };

  if (isBullMQActive && fileQueue) {
    try {
      return await fileQueue.add(jobName, data, defaultOpts);
    } catch (err) {
      return await memoryQueue.add(jobName, data, defaultOpts);
    }
  }
  return await memoryQueue.add(jobName, data, defaultOpts);
};

module.exports = {
  fileQueue,
  redisConnection,
  addFileProcessingJob,
  memoryQueue,
  isBullMQActive: () => isBullMQActive
};
