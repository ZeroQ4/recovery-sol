"use server";

import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export async function logWithdrawal(amountSol: number) {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL) return;
    // INCRBYFLOAT handles decimal addition
    await redis.incrbyfloat("total_recovered_sol", amountSol);
  } catch (error) {
    console.error("Failed to update KV store:", error);
  }
}

export async function getTotalRecoveredSol(): Promise<number> {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL) return 0;
    const total = await redis.get<number>("total_recovered_sol");
    return total || 0;
  } catch (err: unknown) {
    console.error("Failed to read KV store for total:", err);
    return 0;
  }
}
