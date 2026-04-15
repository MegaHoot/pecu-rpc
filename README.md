# pecu-rpc

TypeScript SDK and example applications for the **PecuNovus** JSON-RPC endpoint.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

---

## Overview

PecuNovus exposes a standard **Ethereum JSON-RPC 2.0** interface, meaning it works with MetaMask, ethers.js, and any EVM-compatible tooling — without requiring a full EVM chain underneath.

| | Value |
|-|-------|
| **RPC Endpoint** | `https://mainnet.pecunovus.net/` |
| **Chain ID** | `27272727` (`0x19FAFB7`) |
| **Native Token** | PECU (18 decimals) |
| **Gas** | Free (gasless chain) |
| **Protocol** | JSON-RPC 2.0, EIP-1559 transactions |

---

## Repository Structure

```
pecu-rpc/
│
├── src/                          TypeScript SDK
│   ├── client/
│   │   └── PecuRpcClient.ts      JSON-RPC 2.0 client (all 22 methods)
│   ├── types/
│   │   └── index.ts              Block, Transaction, Receipt, etc.
│   ├── utils/
│   │   └── index.ts              Signing, hex conversion, MetaMask helpers
│   └── index.ts                  Barrel export
│
├── examples/
│   ├── 01-check-balance/         Query PECU balance of any address
│   ├── 02-send-transaction/      Sign, broadcast, and confirm a transfer
│   ├── 03-block-explorer/        CLI block/tx explorer with batch calls
│   ├── 04-metamask-connect/      Browser: add network + send via MetaMask
│   └── 05-wallet-dashboard/      CLI: full network + multi-wallet dashboard
│
├── docs/
│   ├── QUICK_START.md            Get running in 5 minutes
│   ├── RPC_REFERENCE.md          Every supported RPC method
│   ├── SDK_REFERENCE.md          PecuRpcClient API docs
│   ├── METAMASK_GUIDE.md         MetaMask integration + SIWE auth flows
│   └── ARCHITECTURE.md           How the bridge works internally
│
├── package.json
└── tsconfig.json
```

---

## Quick Start

```bash
git clone https://github.com/MegaHoot/pecu-rpc.git
cd pecu-rpc
npm install
```

### Check a balance

```bash
npx ts-node examples/01-check-balance/index.ts 0xYOUR_ADDRESS
```

### Explore recent blocks

```bash
npx ts-node examples/03-block-explorer/index.ts
```

### Full dashboard

```bash
npx ts-node examples/05-wallet-dashboard/index.ts 0xADDR1 0xADDR2
```

### Use the SDK in your own project

```ts
import { PecuRpcClient } from './src';

const client = new PecuRpcClient();

const block   = await client.getBlockNumberDecimal();
const balance = await client.getBalancePecu('0xYOUR_ADDRESS');

console.log(`Block #${block} — Balance: ${balance.toFixed(6)} PECU`);
```

---

## Add PecuNovus to MetaMask

```ts
await window.ethereum.request({
  method: 'wallet_addEthereumChain',
  params: [{
    chainId:           '0x19FAFB7',
    chainName:         'PecuNovus Mainnet',
    nativeCurrency:    { name: 'PECU', symbol: 'PECU', decimals: 18 },
    rpcUrls:           ['https://mainnet.pecunovus.net/'],
    blockExplorerUrls: ['https://pecunovus.net'],
  }],
});
```

Or open `examples/04-metamask-connect/index.html` in a browser.

---

## Supported RPC Methods

| Category | Methods |
|----------|---------|
| Network | `eth_chainId`, `net_version`, `net_listening`, `net_peerCount`, `web3_clientVersion`, `eth_syncing` |
| Blocks | `eth_blockNumber`, `eth_getBlockByNumber`, `eth_getBlockByHash` |
| Accounts | `eth_accounts`, `eth_requestAccounts`, `eth_getBalance`, `eth_getTransactionCount` |
| Transactions | `eth_sendRawTransaction`, `eth_getTransactionByHash`, `eth_getTransactionReceipt` |
| Gas | `eth_gasPrice`, `eth_estimateGas`, `eth_maxPriorityFeePerGas`, `eth_feeHistory` |
| Contract stubs | `eth_getCode`, `eth_call`, `eth_getLogs`, `eth_getStorageAt` |

Full details in [docs/RPC_REFERENCE.md](./docs/RPC_REFERENCE.md).

---

## Sending PECU (Programmatic)

```ts
import { PecuRpcClient, buildSignedTransfer, waitForReceipt } from './src';

const client = new PecuRpcClient();
const nonce  = await client.getTransactionCount('0xSENDER');

const rawTx  = await buildSignedTransfer('0xPRIVATE_KEY', '0xTO', 1.5, nonce);
const txHash = await client.sendRawTransaction(rawTx);

const receipt = await waitForReceipt(() => client.getTransactionReceipt(txHash));
console.log('Confirmed in block', parseInt(receipt.blockNumber, 16));
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [Quick Start](./docs/QUICK_START.md) | Installation, first call, running examples |
| [RPC Reference](./docs/RPC_REFERENCE.md) | All 22 methods with request/response examples |
| [SDK Reference](./docs/SDK_REFERENCE.md) | `PecuRpcClient` API, types, utilities |
| [MetaMask Guide](./docs/METAMASK_GUIDE.md) | Adding the network, SIWE auth, browser integration |
| [Architecture](./docs/ARCHITECTURE.md) | Internal transaction pipeline, data stores, design decisions |

---

## License

MIT
