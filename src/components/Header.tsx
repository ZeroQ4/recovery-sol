"use client";

import dynamic from "next/dynamic";
const WalletMultiButtonDynamic = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);
import { useNetwork } from "./Providers";
import { Globe } from "lucide-react";
import Image from "next/image";

export function Header() {
  const { network, setNetwork } = useNetwork();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-700 bg-zinc-800/95 backdrop-blur text-zinc-100">
      <div className="container mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="Recovery SOL Logo" width={36} height={36} className="rounded-md" />
          <span className="text-xl font-bold tracking-tight">Recovery SOL</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center rounded-md border border-border/50 bg-muted/30 p-1">
            <Globe className="mr-2 h-4 w-4 text-muted-foreground ml-2" />
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value as "devnet" | "mainnet-beta")}
              className="bg-transparent text-sm font-medium focus:outline-none pr-2 py-1 appearance-none cursor-pointer"
            >
              <option value="devnet">Devnet</option>
              <option value="mainnet-beta">Mainnet Beta</option>
            </select>
          </div>
          
          <WalletMultiButtonDynamic className="custom-header-wallet-btn" />
        </div>
      </div>
    </header>
  );
}
