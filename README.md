# Lost Lamports Recovery dApp

A simple Next.js (App Router) based Solana dApp that allows users to recover SOL erroneously sent directly to SPL Token Mint accounts instead of Associated Token Accounts (ATAs). It uses the Token Program's `WithdrawExcessLamports` instruction (discriminator 38).

## Features
- **Check Mint Address**: Automatically calculate the rent-exempt minimum for a mint and compare it with the current balance to find any excess SOL.
- **Withdraw Lamports**: If the connected wallet is the mint authority and excess SOL is found, you can easily simulate and then send a transaction to recover the funds to any destination address.
- **Network Toggle**: Easily switch between Devnet and Mainnet-Beta.
- **Detailed Status Log**: Real-time feedback for simulation, transaction sending, and confirmation, including direct links to Solana Explorer.

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Copy `.env.example` to `.env.local` if you want to provide a custom Devnet RPC endpoint. Otherwise, the app uses standard `clusterApiUrl` from web3.js.
   ```bash
   cp .env.example .env.local
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

