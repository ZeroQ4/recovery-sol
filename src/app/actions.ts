"use server";

import fs from "fs/promises";
import path from "path";

export async function logWithdrawal(pubkey: string, amountSol: number, signature: string) {
  try {
    const logLine = `[${new Date().toISOString()}] Pubkey: ${pubkey} | Amount: ${amountSol} SOL | Tx: ${signature}\n`;
    const logPath = path.join(process.cwd(), "withdrawals.log");
    
    await fs.appendFile(logPath, logLine, "utf-8");
  } catch (error) {
    console.error("Failed to write to log file:", error);
  }
}

export async function getTotalRecoveredSol(): Promise<number> {
  try {
    const logPath = path.join(process.cwd(), "withdrawals.log");
    const content = await fs.readFile(logPath, "utf-8");
    const lines = content.split("\n");
    let total = 0;
    for (const line of lines) {
      if (!line.trim()) continue;
      const amountMatch = line.match(/Amount:\s*([\d.]+)\s*SOL/);
      if (amountMatch && amountMatch[1]) {
        total += parseFloat(amountMatch[1]);
      }
    }
    return total;
  } catch (err: any) {
    if (err.code !== 'ENOENT') {
      console.error("Failed to read log file for total:", err);
    }
    return 0;
  }
}
