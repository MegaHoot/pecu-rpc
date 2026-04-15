# Example 05 — Wallet Dashboard (CLI)

A comprehensive terminal dashboard showing live network health, block statistics, fee info, and balances for one or more addresses — all using batch RPC calls for efficiency.

## Run

```bash
# Network stats only
npx ts-node examples/05-wallet-dashboard/index.ts

# With wallet addresses
npx ts-node examples/05-wallet-dashboard/index.ts 0xADDR1 0xADDR2 0xADDR3
```

## What it demonstrates

| Section | Methods Used | Description |
|---------|-------------|-------------|
| Network Health | `eth_chainId`, `net_version`, `net_listening`, `eth_syncing`, `web3_clientVersion` + GET `/` | Full node status in one batch |
| Block Stats | `eth_blockNumber` + batch `eth_getBlockByNumber` | Average block time from last 10 blocks |
| Fee Info | `eth_gasPrice`, `eth_feeHistory` | Gas price and fee history |
| Wallet Balances | batch `eth_getBalance` + `eth_getTransactionCount` | All addresses in one HTTP request |

## Batch efficiency

The dashboard fetches 10 blocks and N wallet balances using just **2 HTTP requests** total by leveraging the batch API:

```ts
// 10 blocks → 1 HTTP request
const blocks = await client.batch<Block | null>(
  blockNumbers.map(n => ({
    method: 'eth_getBlockByNumber',
    params: ['0x' + n.toString(16), false],
  }))
);

// N wallets × 2 calls → 1 HTTP request
const results = await client.batch<string>(
  addresses.flatMap(addr => [
    { method: 'eth_getBalance',          params: [addr, 'latest'] },
    { method: 'eth_getTransactionCount', params: [addr, 'latest'] },
  ])
);
```

## Sample output

```
🔷  PecuNovus Mainnet Dashboard
   Endpoint: https://mainnet.pecunovus.net/
   Time:     2025-01-15T10:32:00.000Z

════════════════════════════════════════════════════════════
  🌐  Network Health
════════════════════════════════════════════════════════════
  Network                  PecuNovus v3.0
  Symbol                   PECU
  Chain ID                 27272727 (0x19FAFB7)
  Net version              27272727
  Client                   PecuNovus/1.0.0/node.js
  Listening                ✅ yes
  Syncing                  ✅ no (up to date)

════════════════════════════════════════════════════════════
  📦  Block Statistics
════════════════════════════════════════════════════════════
  Latest block             #6,053,821
  Avg block time           12.4s (last 10 blocks)
  Latest hash              0xa1b2c3d4e5f6...
  Gas limit                500,000,000
  Avg txs/block            3.2 (last 10 blocks)

════════════════════════════════════════════════════════════
  👛  Wallet Balances
════════════════════════════════════════════════════════════
  Address: 0xab5801a7d398351b8be11c439e05c5b3259aec9b
    Balance                  2.450000 PECU
    Nonce                    17 txs sent
```
