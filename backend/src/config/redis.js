const redis = require('redis');

let redisClient = null;

const connectRedis = async () => {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('🔴 Redis connected');
    });

    redisClient.on('ready', () => {
      console.log('🔴 Redis ready');
    });

    redisClient.on('end', () => {
      console.log('🔴 Redis connection ended');
    });

    await redisClient.connect();
    
    // Test connection
    await redisClient.ping();
    console.log('🔴 Redis connection successful');
    
  } catch (error) {
    console.error('Redis connection failed:', error);
    throw error;
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
};

// Cache utilities
const cache = {
  async set(key, value, ttl = 3600) {
    try {
      const client = getRedisClient();
      await client.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },

  async get(key) {
    try {
      const client = getRedisClient();
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  async del(key) {
    try {
      const client = getRedisClient();
      await client.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  },

  async exists(key) {
    try {
      const client = getRedisClient();
      return await client.exists(key);
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }
};

module.exports = { 
  connectRedis, 
  getRedisClient, 
  cache 
};
