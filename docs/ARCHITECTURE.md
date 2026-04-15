# PecuNovus RPC Architecture

This document explains how the PecuNovus JSON-RPC bridge works internally — useful for developers integrating at a deep level.

---

## Overview

PecuNovus is a **custom account-model blockchain**, not an EVM chain. It stores balances in MySQL and writes blocks/transactions to MongoDB. The RPC bridge translates standard Ethereum JSON-RPC 2.0 calls (the language MetaMask speaks) into PecuNovus internal operations.

```
MetaMask / ethers.js / dApp
         │
         │  JSON-RPC 2.0 (HTTP POST)
         ▼
┌─────────────────────────────┐
│   PecuNovus RPC Bridge      │
│   POST https://mainnet.     │
│   pecunovus.net/            │
│                             │
│  ┌──────────────────────┐   │
│  │   rpc.controller.js  │   │
│  │   (dispatcher)       │   │
│  └──────────┬───────────┘   │
│             │               │
│  ┌──────────▼───────────┐   │
│  │   rpc.service.js     │   │
│  │   (data layer)       │   │
│  └──────────┬───────────┘   │
└─────────────┼───────────────┘
              │
     ┌────────┼────────────┐
     │        │            │
     ▼        ▼            ▼
  MySQL    MongoDB       Redis
 (balances) (blocks,    (nonces,
            txs)         cache)
              │
              ▼
           Kafka
        (async pipeline
         → Block writer)
```

---

## Transaction Lifecycle

When MetaMask calls `eth_sendRawTransaction`, the following happens synchronously before returning the tx hash:

```
1. Decode RLP tx    ethers.Transaction.from(rawTx)
                    → from, to, value (hex wei)

2. Compute hash     tx.hash ?? keccak256(rawTxBytes)
                    MUST match what MetaMask tracks

3. Resolve sender   SELECT uid, pub_key FROM users
                    WHERE eth_address = from

4. Resolve/register SELECT or INSERT recipient
                    (auto-register unknown addresses)

5. Deduct balance   UPDATE users SET pecu = pecu - amount
                    WHERE uid = sender.uid
                    AND pecu >= amount    ← atomic check

6. Credit balance   UPDATE users SET pecu = pecu + amount
                    WHERE uid = recipient.uid

7. Record UserTx    INSERT INTO userTransaction (MongoDB)
                    for history/audit

8. Publish Kafka    → async consumer writes Block + Transaction
                    to MongoDB (eventually consistent)

9. Store receipt    pendingTxStore.set(txHash, { receipt, tx })
                    TTL: 10 minutes
                    blockHash = latest real block hash (not ZERO_HASH)

10. Increment nonce Redis INCR nonce:{address}

11. Return txHash   MetaMask polls eth_getTransactionReceipt
```

Steps 5–6 are atomic MySQL operations. If step 6 fails, step 5 is rolled back. Kafka publishing (step 8) is non-fatal — if Kafka is unavailable, the balance has already moved in MySQL.

---

## Pending Transaction Store

After `eth_sendRawTransaction`, the receipt is stored in-process (a `Map<string, PendingEntry>`) for 10 minutes. This allows MetaMask to immediately call `eth_getTransactionReceipt` and get a response before the Kafka consumer has written the transaction to MongoDB.

The stored receipt uses a **real block hash** (fetched from MongoDB) rather than a zero hash. This is critical: MetaMask calls `eth_getBlockByHash` after receiving a receipt, and if that returns `null`, MetaMask keeps the transaction in "Pending" state indefinitely.

---

## Nonce Management

Nonces are tracked per-address in Redis:

```
Key:   nonce:{lowercase_address}
Value: integer (starts at 0, increments with each confirmed tx)
```

`eth_getTransactionCount` reads from Redis directly (fast, always accurate). The nonce is incremented **after** the receipt is stored, so the receipt contains the correct nonce.

---

## Address Registration

PecuNovus accounts are identified by a `uid` and a `pub_key` internally. The RPC bridge maps Ethereum-style `0x` addresses to PecuNovus accounts:

- **Registered users:** Have a linked `eth_address` in MySQL from a SIWE (Sign-In with Ethereum) flow.
- **Unknown recipients:** When sending to an unrecognised address, the bridge auto-registers a new PecuNovus account linked to that address.
- **Unknown senders:** `eth_sendRawTransaction` returns an error: `"Sender not registered in PecuNovus"`.

---

## Gas Model

PecuNovus is gasless. All gas-related RPC methods return nominal values for EVM compatibility:

| Method | Returned value |
|--------|----------------|
| `eth_gasPrice` | `0x3B9ACA00` (1 gwei) |
| `eth_estimateGas` | `0x5208` (21,000) |
| `eth_maxPriorityFeePerGas` | `0x3B9ACA00` (1 gwei) |
| `eth_feeHistory` | base fee = `0x0` |

These values satisfy MetaMask's pre-flight checks but no fees are deducted.

---

## Data Stores

| Store | Purpose | Notes |
|-------|---------|-------|
| MySQL | User accounts, PECU balances, wallet links | Source of truth for balances |
| MongoDB (blockchain DB) | Block objects, Transaction objects | Written async via Kafka |
| MongoDB (user DB) | UserTransaction audit log | Written synchronously per tx |
| Redis | Nonce counters, response cache | `nonce:{address}` keys |
| Kafka | Event bus for block/tx pipeline | Topic: `transactions` |

---

## REST Endpoint (GET /)

`GET https://mainnet.pecunovus.net/` returns network metadata without requiring a JSON-RPC envelope:

```json
{
  "name":    "PecuNovus",
  "version": "3.0",
  "chainId": 27272727,
  "symbol":  "PECU",
  "iconUrl": "https://pecunovus.net/static/media/icon.25c8ec299d961b9dd524.ico"
}
```

MetaMask uses this when discovering networks via `wallet_addEthereumChain`.

---

## Known Limitations

| Limitation | Details |
|-----------|---------|
| No smart contracts | `eth_getCode` always returns `0x`. No EVM, no Solidity. |
| No event logs | `eth_getLogs` always returns `[]`. |
| No `eth_call` passthrough | Only the `latestAnswer()` price selector is handled. |
| Pending store is in-memory | Receipts are lost on server restart (10 min TTL). |
| No archive node | Only recent blocks are queryable. |
| Single shard | All balances in one MySQL instance. |
