# Example 01 — Check PECU Balance

Query the PECU balance of any address on PecuNovus mainnet.

## Run

```bash
# From the repo root
npx ts-node examples/01-check-balance/index.ts 0xYOUR_ADDRESS
```

## What it demonstrates

| Step | RPC Method | Description |
|------|-----------|-------------|
| 1 | GET `/` | Fetch network metadata (name, chain ID, symbol) |
| 2 | `eth_blockNumber` | Get the latest block number |
| 3 | `eth_getBalance` | Fetch hex wei balance for the address |
| 4 | `eth_getTransactionCount` | Get the nonce (number of sent transactions) |

## Sample output

```
Network: PecuNovus v3.0
Chain ID: 27272727 (hex: 0x19FAFB7)
Symbol:  PECU
──────────────────────────────────────────────────
Latest block: #6053821 (0x5c5f3d)

Address: 0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B
Balance (hex wei): 0x1bc16d674ec80000
Balance (PECU):    2.00000000 PECU
Nonce (tx count):  17
```

## Key concepts

**Hex wei → PECU**  
PECU uses 18 decimal places (same as ETH). The balance is returned as a big hex integer (wei). To convert:

```
PECU = parseInt(hexWei, 16) / 1e18
```
