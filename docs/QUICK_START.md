# Quick Start

Get up and running with the PecuNovus RPC in under 5 minutes.

---

## Prerequisites

- Node.js 18+
- npm or yarn

---

## Installation

```bash
git clone https://github.com/MegaHoot/pecu-rpc.git
cd pecu-rpc
npm install
```

---

## 1. Make your first RPC call (no setup needed)

The PecuNovus mainnet endpoint is publicly accessible:

```bash
curl -X POST https://mainnet.pecunovus.net/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

Response:
```json
{ "jsonrpc": "2.0", "id": 1, "result": "0x5C5F3D" }
```

---

## 2. Use the TypeScript SDK

```ts
import { PecuRpcClient } from './src';

const client = new PecuRpcClient();

// Get latest block
const blockNum = await client.getBlockNumberDecimal();
console.log('Block:', blockNum);

// Get balance
const balance = await client.getBalancePecu('0xYOUR_ADDRESS');
console.log('Balance:', balance, 'PECU');

// Get network info
const info = await client.getNetworkInfo();
console.log('Chain ID:', info.chainId);
```

---

## 3. Run the example apps

### Check balance
```bash
npx ts-node examples/01-check-balance/index.ts 0xYOUR_ADDRESS
```

### Block explorer
```bash
# Last 5 blocks
npx ts-node examples/03-block-explorer/index.ts

# Specific block
npx ts-node examples/03-block-explorer/index.ts --block 6053000

# Specific transaction
npx ts-node examples/03-block-explorer/index.ts --tx 0xTX_HASH
```

### Full wallet dashboard
```bash
npx ts-node examples/05-wallet-dashboard/index.ts 0xADDR1 0xADDR2
```

### Send PECU (requires private key)
```bash
export PRIVATE_KEY=0xYOUR_PRIVATE_KEY
npx ts-node examples/02-send-transaction/index.ts \
  --to 0xRECIPIENT \
  --amount 1.0
```

### MetaMask browser demo
```bash
open examples/04-metamask-connect/index.html
# or
npx serve examples/04-metamask-connect
```

---

## 4. Add PecuNovus to MetaMask manually

1. Open MetaMask → Settings → Networks → Add a network
2. Enter:
   - **Network Name:** PecuNovus Mainnet
   - **New RPC URL:** `https://mainnet.pecunovus.net/`
   - **Chain ID:** `27272727`
   - **Currency Symbol:** `PECU`
   - **Block Explorer URL:** `https://pecunovus.net`

---

## 5. Use ethers.js directly

```ts
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://mainnet.pecunovus.net/');

// Read balance
const balance = await provider.getBalance('0xYOUR_ADDRESS');
console.log(ethers.formatUnits(balance, 18), 'PECU');

// Send transaction (with private key)
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const tx = await wallet.sendTransaction({
  to:                   '0xRECIPIENT',
  value:                ethers.parseUnits('0.5', 18),
  gasLimit:             21_000n,
  maxFeePerGas:         1_000_000_000n,
  maxPriorityFeePerGas: 1_000_000_000n,
  chainId:              27272727,
});
const receipt = await tx.wait();
console.log('Confirmed in block', receipt?.blockNumber);
```

---

## Next steps

- [RPC Method Reference](./RPC_REFERENCE.md) — every supported method with request/response examples
- [MetaMask Integration Guide](./METAMASK_GUIDE.md) — adding the network, SIWE login, sending PECU
- [Architecture Overview](./ARCHITECTURE.md) — how the RPC bridge works internally
- [SDK API Reference](./SDK_REFERENCE.md) — all `PecuRpcClient` methods
