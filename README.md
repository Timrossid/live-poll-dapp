# Live Poll dApp - Level 2 Stellar

A multi-wallet dApp for real-time voting on Stellar testnet using Soroban smart contracts.

## Features

- **Multi-wallet support** - Connect with Freighter, Lobstr, Albedo, xBull, or WalletConnect via StellarWalletsKit
- **Soroban smart contract** - Poll logic deployed as a Soroban contract on testnet
- **Real-time updates** - Polls every 5 seconds for live result changes
- **Transaction status tracking** - Pending / Success / Failed states with explorer link
- **Error handling** - 3 error types: Wallet not found, User rejected, Insufficient balance

## Prerequisites

- Node.js 18+
- Rust and Soroban CLI (`cargo install soroban-cli`)
- A Stellar wallet (Freighter, Lobstr, etc.)

## Smart Contract

The poll contract is in `contract/`. It supports:
- `initialize(admin, question, options)` - Set up a new poll
- `vote(voter, option_index)` - Cast a vote (emits `vote` event)
- `get_question()` - Read the poll question
- `get_options()` - Read poll options
- `get_votes()` - Read vote counts per option
- `has_voted(voter)` - Check if address has voted
- `get_total_voters()` - Get total participant count

### Build & Deploy

```bash
cd contract
cargo build --release       # Build WASM
soroban contract deploy     # Deploy to testnet
  --wasm target/wasm32-unknown-unknown/release/live_poll.wasm
  --network testnet
  --source <YOUR_SECRET_KEY>

# Initialize the poll
soroban contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  --source <YOUR_SECRET_KEY> \
  -- \
  initialize \
  --admin <YOUR_PUBLIC_KEY> \
  --question '"What framework should we use next?"' \
  --options '["React", "Vue", "Svelte", "Solid"]'
```

## Frontend Setup

```bash
npm install
npm run dev
```

Set the contract ID via environment variable:

```bash
# Option 1: .env file
VITE_CONTRACT_ID=CD6OGC46OFCV52IJQKEDVKLX5ASA3ZMSTHAAZQIPDSJV6VZ3KUJDEP4D

# Option 2: Enter it in the UI when no env var is set
```

## Deployed Contract (Testnet)

**Contract ID:** `CDAXDH53B55L6XMBI7R4RVOI64YZ7MVSWE27LX4ERP352NWCCI5YQTMU`

- **Deploy tx:** [5283698bee...](https://stellar.expert/explorer/testnet/tx/5283698beec5041d7eda1d0efaae83884b8fdc6de0a0df8a1591f96ae957f287)
- **Initialize tx:** [f637b26a39...](https://stellar.expert/explorer/testnet/tx/f637b26a39cf3a047bf37ebd87a0d721c3e182479895f647ab66e7c3f3906fb5)
- **Vote tx:** [c2c43e694b...](https://stellar.expert/explorer/testnet/tx/c2c43e694b7b2512f196eace1b62b1cf2c6162b334e2edb1a0db3d78872fac7e)

Poll: **"What framework should we use for the next project?"**
Options: React (1 vote), Vue (0), Svelte (0), Solid (0)

## Screenshots

> *Replace with your screenshots:*
> 1. Wallet options available (the StellarWalletsKit modal showing Freighter, Lobstr, etc.)

## Project Structure

```
live-poll-dapp/
  contract/              # Soroban smart contract (Rust)
    Cargo.toml
    src/lib.rs
  src/                   # React frontend (TypeScript)
    components/
      WalletConnect.tsx     # Multi-wallet connection UI
      PollQuestion.tsx      # Poll question display
      PollOptions.tsx       # Voting options with progress bars
      ResultsChart.tsx      # Live results bar chart
      TransactionStatus.tsx # Tx status (pending/success/fail)
    hooks/
      useWallet.ts          # StellarWalletsKit multi-wallet hook
      usePoll.ts            # Poll data fetching + event polling
    utils/
      stellar.ts            # Horizon server, balance checks
      contract.ts           # Soroban RPC contract interaction
    App.tsx                 # Main app
    App.css                 # Styles
    main.tsx                # Entry point
  index.html
  package.json
  vite.config.ts
  tsconfig.json
```

## Error Handling

| Error Type | Scenario | Handling |
|---|---|---|
| Wallet not found | User has no Stellar wallet extension | Shows error message with install prompt |
| User rejected | User closes wallet modal or denies signature | Resets state, shows cancellation message |
| Insufficient balance | Account lacks XLM for contract entry fee | Shows balance requirement message |
