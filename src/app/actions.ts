"use server";

import { kv } from "@vercel/kv";

export async function logWithdrawal(pubkey: string, amountSol: number, signature: string) {
  try {
    if (!process.env.KV_REST_API_URL) return;
    // INCRBYFLOAT handles decimal addition
    await kv.incrbyfloat("total_recovered_sol", amountSol);
  } catch (error) {
    console.error("Failed to update KV store:", error);
  }
}

export async function getTotalRecoveredSol(): Promise<number> {
  try {
    if (!process.env.KV_REST_API_URL) return 0;
    const total = await kv.get<number>("total_recovered_sol");
    return total || 0;
  } catch (err: any) {
    console.error("Failed to read KV store for total:", err);
    return 0;
  }
}
