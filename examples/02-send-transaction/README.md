# Example 02 — Send PECU Transaction

Build, sign, broadcast, and confirm a PECU transfer — entirely from TypeScript without MetaMask.

## Run

```bash
# Set your private key securely
export PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

# Send 0.5 PECU to a recipient
npx ts-node examples/02-send-transaction/index.ts \
  --to   0xRECIPIENT_ADDRESS \
  --amount 0.5
```

## What it demonstrates

| Step | RPC Method | Description |
|------|-----------|-------------|
| 1 | `eth_getBalance` | Verify sender has enough PECU |
| 2 | `eth_getTransactionCount` | Fetch nonce to prevent replay |
| 3 | *(local)* | Build & sign EIP-1559 tx with ethers v6 |
| 4 | `eth_sendRawTransaction` | Broadcast the signed transaction |
| 5 | `eth_getTransactionReceipt` | Poll until confirmed |

## Transaction structure

PecuNovus accepts standard EIP-1559 transactions (type `0x2`):

```ts
const tx = {
  type:                 2,
  chainId:              27272727,   // PECU_CHAIN_ID
  nonce:                <current>,
  to:                   '0xRECIPIENT',
  value:                parseUnits('0.5', 18),  // hex wei
  gasLimit:             21_000n,
  maxFeePerGas:         1_000_000_000n,  // 1 gwei (nominal)
  maxPriorityFeePerGas: 1_000_000_000n,
};
```

PecuNovus is **gasless** — gas parameters are accepted for EVM compatibility but no fees are charged.

## Security notes

- ⚠️ Never hardcode private keys in source files
- Use environment variables or a secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)
- For production, consider hardware wallets or MPC signing
