"use client";

import { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, getMint } from "@solana/spl-token";
import { AlertCircle, CheckCircle2, Info, Loader2, ArrowRight } from "lucide-react";
import { useNetwork } from "./Providers";
import { logWithdrawal } from "@/app/actions";

type LogEntry = {
  id: string;
  type: "info" | "success" | "error";
  message: string;
};

export function LostLamportsApp({ initialTotalRecovered = 0 }: { initialTotalRecovered?: number }) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const { network } = useNetwork();

  const [mintAddress, setMintAddress] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  
  const [isChecking, setIsChecking] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [totalRecovered, setTotalRecovered] = useState(initialTotalRecovered);
  
  // Results
  const [excessLamports, setExcessLamports] = useState<number | null>(null);
  const [mintAuthority, setMintAuthority] = useState<PublicKey | null>(null);
  const [tokenProgramId, setTokenProgramId] = useState<PublicKey>(TOKEN_PROGRAM_ID);

  const isAuthority = Boolean(publicKey && mintAuthority && mintAuthority.equals(publicKey));

  useEffect(() => {
    if (isAuthority && !destinationAddress && publicKey) {
      setDestinationAddress(publicKey.toBase58());
    }
  }, [isAuthority, destinationAddress, publicKey]);

  // Reset state when network changes to prevent accidental mainnet transactions using devnet data
  useEffect(() => {
    setExcessLamports(null);
    setMintAuthority(null);
    setLogs([]);
  }, [network]);

  const addLog = (type: "info" | "success" | "error", message: string) => {
    setLogs((prev) => [...prev, { id: Math.random().toString(36).substr(2, 9), type, message }]);
  };

  const clearLogs = () => setLogs([]);

  const handleCheck = async () => {
    if (!mintAddress) return;
    
    setIsChecking(true);
    clearLogs();
    setExcessLamports(null);
    setMintAuthority(null);
    
    addLog("info", `Checking address: ${mintAddress}...`);
    
    try {
      let pubkey: PublicKey;
      try {
        pubkey = new PublicKey(mintAddress);
      } catch {
        throw new Error("Invalid Mint Address format");
      }

      const accountInfo = await connection.getAccountInfo(pubkey);
      if (!accountInfo) {
        throw new Error("Account not found");
      }

      let programId = TOKEN_PROGRAM_ID;
      if (accountInfo.owner.equals(TOKEN_PROGRAM_ID)) {
        addLog("info", "Token Program mint found");
      } else if (accountInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) {
        programId = TOKEN_2022_PROGRAM_ID;
        addLog("info", "Token-2022 Program mint found");
      } else {
        throw new Error("Address is not a Token Program mint account");
      }
      
      setTokenProgramId(programId);

      const mint = await getMint(connection, pubkey, connection.commitment, programId);
      
      const rentExempt = await connection.getMinimumBalanceForRentExemption(accountInfo.data.length);
      const balance = accountInfo.lamports;
      const excess = balance - rentExempt;
      
      addLog("info", `Balance: ${balance / 1e9} SOL, Rent Exempt: ${rentExempt / 1e9} SOL`);
      
      if (excess > 0) {
        addLog("success", `Found excess! ${excess / 1e9} SOL can be recovered.`);
        setExcessLamports(excess);
      } else {
        addLog("info", "No excess SOL found on this mint account.");
        setExcessLamports(0);
      }

      if (mint.mintAuthority) {
        addLog("info", `Mint Authority: ${mint.mintAuthority.toBase58()}`);
        setMintAuthority(mint.mintAuthority);
        
        if (publicKey) {
          if (mint.mintAuthority.equals(publicKey)) {
            addLog("success", "Your connected wallet is the mint authority!");
          } else {
            addLog("error", "Your connected wallet is NOT the mint authority. You cannot withdraw.");
          }
        } else {
          addLog("info", "Please connect the Mint Authority wallet to withdraw.");
        }
      } else {
        addLog("error", "Mint has no authority. Withdraw is impossible.");
      }
      
    } catch (err) {
      addLog("error", err instanceof Error ? err.message : "Unknown error occurred");
      console.error(err);
    } finally {
      setIsChecking(false);
    }
  };

  const handleWithdraw = async () => {
    if (!publicKey || !mintAuthority || !excessLamports || excessLamports <= 0) return;
    if (!isAuthority) return;

    setIsWithdrawing(true);
    addLog("info", "Preparing transaction...");

    try {
      let destPubkey: PublicKey;
      try {
        destPubkey = new PublicKey(destinationAddress);
      } catch {
        throw new Error("Invalid destination address");
      }

      const mintPubkey = new PublicKey(mintAddress);

      const instruction = new TransactionInstruction({
        programId: tokenProgramId,
        keys: [
          { pubkey: mintPubkey, isSigner: false, isWritable: true },
          { pubkey: destPubkey, isSigner: false, isWritable: true },
          { pubkey: publicKey, isSigner: true, isWritable: false },
        ],
        data: Buffer.from([38]), // WithdrawExcessLamports discriminator
      });

      const { blockhash } = await connection.getLatestBlockhash();
      const transaction = new Transaction({
        recentBlockhash: blockhash,
        feePayer: publicKey,
      }).add(instruction);

      addLog("info", "Simulating transaction...");
      const simulation = await connection.simulateTransaction(transaction);

      if (simulation.value.err) {
        console.error("Simulation error:", simulation.value.err, simulation.value.logs);
        throw new Error(`Simulation failed: ${JSON.stringify(simulation.value.err)}`);
      }
      
      addLog("success", "Simulation successful! Sending transaction...");

      const signature = await sendTransaction(transaction, connection);
      addLog("info", `Transaction sent: ${signature}`);
      addLog("info", "Waiting for confirmation...");

      await connection.confirmTransaction(signature, "confirmed");
      
      // Log to file on server
      await logWithdrawal(excessLamports / 1e9);
      
      const clusterQuery = network === "devnet" ? "?cluster=devnet" : "";
      const explorerLink = `https://solscan.io/tx/${signature}${clusterQuery}`;
      
      addLog("success", `Transaction confirmed!`);
      // Trick to render link inside log
      setLogs((prev) => [
        ...prev, 
        { id: Math.random().toString(36).substr(2, 9), type: "success", message: `Link|${explorerLink}` }
      ]);
      
      addLog("success", `Done! ${(excessLamports / 1e9).toFixed(4)} SOL recovered.`);
      
      setTotalRecovered((prev) => Number(prev) + (excessLamports / 1e9));
      setExcessLamports(0); // reset excess visually
    } catch (err) {
      addLog("error", err instanceof Error ? err.message : "Failed to withdraw");
      console.error(err);
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <div className="flex flex-col gap-8">
        
        <div className="mb-4">
          <div className="text-center mb-8">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-100 mb-3">
              Free Recovery SOL from Mint Address
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto">
              Accidentally sent SOL to a SPL Token Mint account? 
              Use this tool to check for stranded SOL and safely withdraw excess lamports parked beyond the rent-exempt minimum. 
              Just paste your mint address, connect your Mint Authority wallet, and recover your lost Solana funds.
            </p>
          </div>
          {Number(totalRecovered) > 0 && (
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  Total Recovered: <strong>{Number(totalRecovered).toLocaleString('en-US', { maximumFractionDigits: 4 })} SOL</strong>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Check Section */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-zinc-100">1. Check Mint Address</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Mint Address (e.g. Bcjbvo...)"
              value={mintAddress}
              onChange={(e) => setMintAddress(e.target.value.trim())}
              className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            <button
              onClick={handleCheck}
              disabled={isChecking || !mintAddress}
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0"
            >
              {isChecking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Check Address"}
            </button>
          </div>
        </div>

        {/* Withdraw Section */}
        {excessLamports !== null && (
          <div className={`rounded-xl border p-6 shadow-sm backdrop-blur transition-all ${isAuthority && excessLamports > 0 ? "bg-zinc-900/50 border-primary/50" : "bg-zinc-900/30 border-zinc-800"}`}>
            <h2 className="text-xl font-semibold mb-4 text-zinc-100">2. Withdraw Lamports</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Recoverable Amount:</span>
                <span className="text-lg font-bold text-primary">{(excessLamports / 1e9).toFixed(9)} SOL</span>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Destination Address</label>
                <input
                  type="text"
                  placeholder="Destination Address (defaults to your wallet)"
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value.trim())}
                  disabled={!isAuthority || excessLamports <= 0}
                  className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                />
              </div>

              <button
                onClick={handleWithdraw}
                disabled={isWithdrawing || !isAuthority || excessLamports <= 0 || !destinationAddress || !publicKey}
                className="w-full inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {isWithdrawing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Recover SOL"}
                {!isWithdrawing && <ArrowRight className="ml-2 h-4 w-4" />}
              </button>
              
              {!publicKey && (
                <p className="text-sm text-destructive mt-2">Please connect your wallet first.</p>
              )}
            </div>
          </div>
        )}

        {/* Status Logs */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 shadow-sm min-h-[200px] flex flex-col font-mono text-sm">
          <div className="border-b border-zinc-800 pb-2 mb-2 font-semibold text-zinc-300">Status Log</div>
          <div className="flex-1 space-y-2">
            {logs.length === 0 ? (
              <div className="text-muted-foreground text-center py-8">Waiting for action...</div>
            ) : (
              logs.map((log) => {
                const isLink = log.message.startsWith("Link|");
                return (
                  <div key={log.id} className="flex items-start gap-2">
                    {log.type === "info" && <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />}
                    {log.type === "success" && <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />}
                    {log.type === "error" && <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />}
                    <span className={`break-all ${log.type === "error" ? "text-destructive" : log.type === "success" ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                      {isLink ? (
                        <a href={log.message.split("|")[1]} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
                          View on Solscan
                        </a>
                      ) : (
                        log.message
                      )}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
