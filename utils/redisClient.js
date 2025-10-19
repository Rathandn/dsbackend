import { Redis } from '@upstash/redis'
import dotenv from 'dotenv'
dotenv.config()

let redis

export async function initRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('❌ Missing Upstash Redis credentials in .env')
  }

  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })

  console.log('✅ Connected to Upstash Redis REST API')
}

export function getRedis() {
  if (!redis) throw new Error('Redis not initialized')
  return redis
}
