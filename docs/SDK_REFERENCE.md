# SDK API Reference

Complete reference for the `PecuRpcClient` TypeScript class.

---

## Installation

```ts
import { PecuRpcClient } from './src';
// or after build:
import { PecuRpcClient } from 'pecu-rpc';
```

---

## Constructor

```ts
new PecuRpcClient(config?: PecuRpcClientConfig)
```

### Config options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `endpoint` | `string` | `'https://mainnet.pecunovus.net/'` | RPC endpoint URL |
| `authToken` | `string` | `undefined` | Bearer token for authenticated endpoints |
| `timeout` | `number` | `10000` | Request timeout in milliseconds |

```ts
const client = new PecuRpcClient({
  endpoint:  'https://mainnet.pecunovus.net/',
  timeout:   15_000,
});
```

---

## Low-level Methods

### `call<T>(method, params?)`

Send a single JSON-RPC request. Throws `RpcError` on JSON-RPC errors.

```ts
const hex = await client.call<string>('eth_blockNumber', []);
```

### `batch<T>(requests)`

Send multiple requests in one HTTP call.

```ts
const results = await client.batch<string | null>([
  { method: 'eth_chainId' },
  { method: 'eth_blockNumber' },
  { method: 'eth_getBalance', params: ['0xADDR', 'latest'] },
]);
```

---

## Network Methods

### `getChainId()`
Returns `string` — hex chain ID (`"0x19FAFB7"`).

### `getNetworkVersion()`
Returns `string` — decimal chain ID (`"27272727"`).

### `isListening()`
Returns `boolean` — always `true`.

### `getClientVersion()`
Returns `string` — node software version.

### `getNetworkInfo()`
Returns `NetworkInfo` — via REST GET, not JSON-RPC.

```ts
interface NetworkInfo {
  name:    string;   // "PecuNovus"
  version: string;   // "3.0"
  chainId: number;   // 27272727
  symbol:  string;   // "PECU"
  iconUrl: string;
}
```

---

## Block Methods

### `getBlockNumber()`
Returns `string` — latest block number as hex.

### `getBlockNumberDecimal()`
Returns `number` — latest block number as integer.

### `getBlockByNumber(blockTag, fullTx?)`
Returns `Block | null`.

```ts
const block = await client.getBlockByNumber('latest');
const block = await client.getBlockByNumber('0x5C5F3D');
const block = await client.getBlockByNumber('earliest');
```

### `getBlockByHash(blockHash, fullTx?)`
Returns `Block | null`.

---

## Account & Balance Methods

### `getBalance(address, blockTag?)`
Returns `string` — hex wei balance.

```ts
const hexWei = await client.getBalance('0xADDR');
```

### `getBalancePecu(address)`
Returns `number` — PECU float (convenience wrapper).

```ts
const pecu = await client.getBalancePecu('0xADDR');
console.log(pecu.toFixed(6), 'PECU');
```

### `getTransactionCount(address, blockTag?)`
Returns `number` — nonce as integer.

---

## Transaction Methods

### `sendRawTransaction(rawTx)`
Returns `string` — transaction hash.

```ts
const txHash = await client.sendRawTransaction('0x02f874...');
```

Throws `RpcError` with:
- code `-32000` for application errors (insufficient balance, unregistered sender)
- code `-32602` for missing/malformed params

### `getTransactionByHash(txHash)`
Returns `Transaction | null`.

### `getTransactionReceipt(txHash)`
Returns `TransactionReceipt | null` — `null` if not yet confirmed.

---

## Gas Methods

### `getGasPrice()`
Returns `string` — `"0x3B9ACA00"` (1 gwei).

### `estimateGas(txParams)`
Returns `string` — `"0x5208"` (21,000).

### `getFeeHistory(blockCount, newestBlock, rewardPercentiles)`
Returns `FeeHistory`.

---

## Misc Methods

### `isSyncing()`
Returns `false`.

### `getCode(address, blockTag?)`
Returns `string` — `"0x"`.

### `getLogs(filter)`
Returns `Log[]` — always `[]`.

---

## Utility Functions

```ts
import {
  hexWeiToPecu,
  pecuToHexWei,
  formatPecu,
  hexToDecimal,
  toHex,
  normaliseAddress,
  isValidAddress,
  buildSignedTransfer,
  computeTxHash,
  waitForReceipt,
  addPecuNetworkToMetaMask,
  switchToPecuNetwork,
  PECU_CHAIN_ID,
  PECU_CHAIN_HEX,
  PECU_ENDPOINT,
} from './src/utils';
```

### `hexWeiToPecu(hexWei)`
Convert hex wei string to PECU float.

```ts
hexWeiToPecu('0x1BC16D674EC80000')  // → 2.0
```

### `pecuToHexWei(pecu)`
Convert PECU float to hex wei.

```ts
pecuToHexWei(2.0)  // → '0x1bc16d674ec80000'
```

### `formatPecu(hexWei, decimals?)`
Convert hex wei to fixed-point string. Default 6 decimal places.

```ts
formatPecu('0x1BC16D674EC80000', 4)  // → '2.0000'
```

### `buildSignedTransfer(privateKey, toAddress, amountPecu, nonce)`
Build and sign a PECU transfer. Returns RLP hex ready for `sendRawTransaction`.

```ts
const rawTx = await buildSignedTransfer(
  '0xPRIVATE_KEY',
  '0xRECIPIENT',
  1.5,   // PECU
  17,    // nonce
);
```

### `computeTxHash(rawTx)`
Compute the keccak256 hash of a signed raw transaction.

### `waitForReceipt(fetchFn, intervalMs?, timeoutMs?)`
Poll until a receipt appears or timeout is reached.

```ts
const receipt = await waitForReceipt(
  () => client.getTransactionReceipt(txHash),
  2_000,   // poll every 2s
  60_000,  // give up after 60s
);
```

### `addPecuNetworkToMetaMask()` *(browser only)*
Calls `wallet_addEthereumChain` to add PecuNovus.

### `switchToPecuNetwork()` *(browser only)*
Calls `wallet_switchEthereumChain`.

---

## Error Handling

### `RpcError`

Thrown by `call()` and `batch()` when the JSON-RPC response contains an `error` field.

```ts
import { RpcError } from './src';

try {
  await client.sendRawTransaction(rawTx);
} catch (err) {
  if (err instanceof RpcError) {
    console.error(`RPC error ${err.code}: ${err.message}`);
    // err.code === -32000 → application error (insufficient balance etc.)
    // err.code === -32601 → method not found
    // err.code === -32602 → invalid params
    // err.code === -32603 → internal server error
  }
}
```

---

## TypeScript Types

All types are exported from `./src/types`:

```ts
import type {
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcError,
  RpcMethod,
  Block,
  Transaction,
  TransactionReceipt,
  Log,
  LogFilter,
  FeeHistory,
  NetworkInfo,
  PecuRpcClientConfig,
} from './src/types';
```
