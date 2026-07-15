"use server";

import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

export async function logWithdrawal(amountSol: number) {
  try {
    if (!process.env.KV_REST_API_URL && !process.env.UPSTASH_REDIS_REST_URL) return;
    // INCRBYFLOAT handles decimal addition
    await redis.incrbyfloat("total_recovered_sol", amountSol);
  } catch (error) {
    console.error("Failed to update KV store:", error);
  }
}

export async function getTotalRecoveredSol(): Promise<number> {
  try {
    if (!process.env.KV_REST_API_URL && !process.env.UPSTASH_REDIS_REST_URL) return 0;
    const total = await redis.get("total_recovered_sol");
    return Number(total) || 0;
  } catch (err: unknown) {
    console.error("Failed to read KV store for total:", err);
    return 0;
  }
}
