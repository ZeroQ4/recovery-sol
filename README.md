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

## Testing on Devnet

To test the application on Devnet, you can use the following test accounts:
- **Mint Account**: `BcjbvoHqDxuq34QZQpVojewK7xcvi8bQtsmi6LS827yz`
- **Mint Authority**: `MxXYGT3gSA5Bi9N4EDXvQ4oftMX8PBoKFYKYXWMxYHj`

*Note: You will need to import the test authority's private key into your Phantom or Solflare wallet (set to Devnet) to actually perform the withdrawal.*

## Deployment on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new).
1. Push your code to a GitHub repository.
2. Import the project in Vercel.
3. Make sure the root directory is correctly set (e.g., `lost-lamports-app`) if you have a monorepo setup.
4. Add any environment variables (e.g., `NEXT_PUBLIC_DEVNET_RPC_URL`) in the Vercel dashboard.
5. Deploy.
