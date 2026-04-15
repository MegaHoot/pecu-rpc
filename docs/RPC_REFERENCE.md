# PecuNovus RPC Protocol Reference

This document describes every JSON-RPC 2.0 method supported by the PecuNovus mainnet endpoint.

---

## Endpoint

```
https://mainnet.pecunovus.net/
```

- **Protocol:** JSON-RPC 2.0 over HTTP POST
- **Content-Type:** `application/json`
- **Batch requests:** Supported (send an array of request objects)
- **Network info (REST):** `GET https://mainnet.pecunovus.net/` returns network metadata

---

## Network Configuration

| Parameter | Value |
|-----------|-------|
| Network Name | PecuNovus Mainnet |
| Chain ID | `27272727` |
| Chain ID (hex) | `0x19FAFB7` |
| Native Currency | PECU |
| Decimals | 18 |
| RPC URL | `https://mainnet.pecunovus.net/` |
| Block Explorer | `https://pecunovus.net` |

---

## Request / Response Format

### Single request

```json
{
  "jsonrpc": "2.0",
  "method":  "eth_blockNumber",
  "params":  [],
  "id":      1
}
```

### Single response

```json
{
  "jsonrpc": "2.0",
  "id":      1,
  "result":  "0x5C5F3D"
}
```

### Batch request

Send an array; receive an array of responses in the same order.

```json
[
  { "jsonrpc": "2.0", "method": "eth_chainId",    "params": [], "id": 1 },
  { "jsonrpc": "2.0", "method": "eth_blockNumber", "params": [], "id": 2 }
]
```

### Error response

JSON-RPC errors always use **HTTP 200**. Check the `error` field.

```json
{
  "jsonrpc": "2.0",
  "id":      1,
  "error": {
    "code":    -32601,
    "message": "Method not found: debug_traceTransaction"
  }
}
```

---

## Standard Error Codes

| Code | Meaning |
|------|---------|
| `-32700` | Parse error — invalid JSON |
| `-32600` | Invalid request — missing required fields |
| `-32601` | Method not found |
| `-32602` | Invalid params — e.g. missing address |
| `-32603` | Internal error |
| `-32000` | Application-level error — e.g. insufficient balance, sender not registered |

---

## Methods

---

### Network

---

#### `eth_chainId`

Returns the PecuNovus chain ID as a hex string.

**Params:** none

**Returns:** `string` — hex chain ID

```json
// Request
{ "jsonrpc": "2.0", "method": "eth_chainId", "params": [], "id": 1 }

// Response
{ "jsonrpc": "2.0", "id": 1, "result": "0x19FAFB7" }
```

---

#### `net_version`

Returns the chain ID as a decimal string.

**Params:** none

**Returns:** `string`

```json
{ "jsonrpc": "2.0", "id": 1, "result": "27272727" }
```

---

#### `net_listening`

Returns whether the node is actively listening. Always `true`.

**Params:** none

**Returns:** `boolean`

```json
{ "jsonrpc": "2.0", "id": 1, "result": true }
```

---

#### `net_peerCount`

Returns the number of peers. Always `0x1`.

**Params:** none

**Returns:** `string` (hex)

```json
{ "jsonrpc": "2.0", "id": 1, "result": "0x1" }
```

---

#### `web3_clientVersion`

Returns the node software version string.

**Params:** none

**Returns:** `string`

```json
{ "jsonrpc": "2.0", "id": 1, "result": "PecuNovus/1.0.0/node.js" }
```

---

#### `eth_syncing`

Returns `false` — the PecuNovus node is always considered synced.

**Params:** none

**Returns:** `false`

```json
{ "jsonrpc": "2.0", "id": 1, "result": false }
```

---

### Blocks

---

#### `eth_blockNumber`

Returns the latest block number as a hex string.

**Params:** none

**Returns:** `string` — hex block number

```json
// Response
{ "jsonrpc": "2.0", "id": 1, "result": "0x5C5F3D" }
```

---

#### `eth_getBlockByNumber`

Returns a block object by block number or tag.

**Params:**

| # | Type | Description |
|---|------|-------------|
| 0 | `string` | Block tag: hex number, `"latest"`, `"earliest"`, or `"pending"` |
| 1 | `boolean` | If `true`, include full transaction objects; if `false`, include only hashes |

**Returns:** `Block | null`

```json
// Request
{
  "jsonrpc": "2.0",
  "method":  "eth_getBlockByNumber",
  "params":  ["latest", false],
  "id":      1
}

// Response
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "number":           "0x5C5F3D",
    "hash":             "0xabc123...",
    "parentHash":       "0xdef456...",
    "nonce":            "0x0000000000000000",
    "sha3Uncles":       "0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
    "logsBloom":        "0x000...000",
    "transactionsRoot": "0x56e81f171...",
    "stateRoot":        "0x56e81f171...",
    "receiptsRoot":     "0x56e81f171...",
    "miner":            "0x0000000000000000000000000000000000000000",
    "difficulty":       "0x0",
    "totalDifficulty":  "0x0",
    "extraData":        "0x",
    "size":             "0x400",
    "gasLimit":         "0x1DCD6500",
    "gasUsed":          "0x5208",
    "timestamp":        "0x6637A4E2",
    "transactions":     ["0xhash1", "0xhash2"],
    "uncles":           [],
    "baseFeePerGas":    "0x0"
  }
}
```

---

#### `eth_getBlockByHash`

Returns a block by its hash.

**Params:**

| # | Type | Description |
|---|------|-------------|
| 0 | `string` | 0x-prefixed 32-byte block hash |
| 1 | `boolean` | Full tx objects or hash list |

**Returns:** `Block | null`

> If the block hash is not yet indexed (e.g. a very recent submission), the RPC bridge falls back to returning the latest block so MetaMask can always confirm transactions.

---

### Accounts & Balances

---

#### `eth_getBalance`

Returns the PECU balance of an address as hex wei.

**Params:**

| # | Type | Description |
|---|------|-------------|
| 0 | `string` | Ethereum-style address (0x-prefixed) |
| 1 | `string` | Block tag (`"latest"` recommended) |

**Returns:** `string` — hex wei (18 decimals)

```json
// Request
{
  "jsonrpc": "2.0",
  "method":  "eth_getBalance",
  "params":  ["0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B", "latest"],
  "id":      1
}

// Response: 2 PECU = 2 × 10^18 wei
{ "jsonrpc": "2.0", "id": 1, "result": "0x1BC16D674EC80000" }
```

**Converting to PECU:**

```ts
const pecu = Number(BigInt('0x1BC16D674EC80000')) / 1e18;  // → 2.0
```

---

#### `eth_accounts` / `eth_requestAccounts`

Returns an empty array `[]`. PecuNovus does not manage private keys on the server — wallets (MetaMask) handle their own keys.

**Params:** none

**Returns:** `string[]` — always `[]`

---

#### `eth_getTransactionCount`

Returns the nonce (number of transactions sent) for an address, as hex.

**Params:**

| # | Type | Description |
|---|------|-------------|
| 0 | `string` | Address |
| 1 | `string` | Block tag |

**Returns:** `string` — hex nonce

```json
{ "jsonrpc": "2.0", "id": 1, "result": "0x11" }
// → nonce = 17
```

> The nonce is stored in Redis and incremented atomically with each successful `eth_sendRawTransaction`. It is used by MetaMask to prevent replay attacks.

---

### Transactions

---

#### `eth_sendRawTransaction`

Broadcasts a signed transaction to the PecuNovus network.

**Params:**

| # | Type | Description |
|---|------|-------------|
| 0 | `string` | RLP-encoded signed transaction hex (0x-prefixed) |

**Returns:** `string` — transaction hash

```json
// Request
{
  "jsonrpc": "2.0",
  "method":  "eth_sendRawTransaction",
  "params":  ["0x02f87082..."],
  "id":      1
}

// Response
{ "jsonrpc": "2.0", "id": 1, "result": "0xabc123def456..." }
```

**Transaction processing pipeline:**

```
1. Decode signed tx   → extract from, to, value (using ethers v6)
2. Compute tx hash    → keccak256(rawTxBytes) — matches MetaMask's hash
3. Resolve addresses  → look up uid + pub_key in MySQL
4. Deduct balance     → MySQL (synchronous)
5. Credit balance     → MySQL (synchronous)
6. Record UserTx      → MongoDB (for history)
7. Publish to Kafka   → async pipeline writes Block + Transaction to MongoDB
8. Store receipt      → in-memory store keyed by tx hash (10 min TTL)
9. Increment nonce    → Redis per-address counter
10. Return hash       → MetaMask polls eth_getTransactionReceipt
```

**Error responses:**

| Error | Meaning |
|-------|---------|
| `Sender not registered in PecuNovus` | The `from` address has no linked PecuNovus account |
| `Insufficient PECU balance` | Sender balance < transfer amount |
| `Failed to credit recipient` | Recipient credit failed (sender is auto-rolled back) |
| `Could not parse from/to` | Malformed raw transaction |
| `Amount must be > 0` | Zero-value transfers not allowed |

---

#### `eth_getTransactionByHash`

Returns a transaction object by hash.

**Params:**

| # | Type | Description |
|---|------|-------------|
| 0 | `string` | 0x-prefixed transaction hash |

**Returns:** `Transaction | null`

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "blockHash":            "0xabc...",
    "blockNumber":          "0x5C5F3D",
    "from":                 "0xsender...",
    "gas":                  "0x5208",
    "gasPrice":             "0x0",
    "maxFeePerGas":         "0x0",
    "maxPriorityFeePerGas": "0x0",
    "hash":                 "0xtxhash...",
    "input":                "0x",
    "nonce":                "0x11",
    "to":                   "0xrecipient...",
    "transactionIndex":     "0x0",
    "value":                "0x1BC16D674EC80000",
    "type":                 "0x2",
    "chainId":              "0x19FAFB7",
    "v": "0x1", "r": "0x000...", "s": "0x000..."
  }
}
```

> Transactions are first served from a 10-minute in-memory pending store immediately after broadcast, then from MongoDB once the Kafka consumer writes them.

---

#### `eth_getTransactionReceipt`

Returns the receipt for a transaction.

**Params:**

| # | Type | Description |
|---|------|-------------|
| 0 | `string` | Transaction hash |

**Returns:** `TransactionReceipt | null` — `null` if still pending

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "transactionHash":   "0xtxhash...",
    "transactionIndex":  "0x0",
    "blockHash":         "0xblockhash...",
    "blockNumber":       "0x5C5F3D",
    "from":              "0xsender...",
    "to":                "0xrecipient...",
    "cumulativeGasUsed": "0x5208",
    "gasUsed":           "0x5208",
    "contractAddress":   null,
    "logs":              [],
    "logsBloom":         "0x000...000",
    "type":              "0x2",
    "status":            "0x1",
    "effectiveGasPrice": "0x0"
  }
}
```

**`status` values:**

| Value | Meaning |
|-------|---------|
| `0x1` | Transaction succeeded |
| `0x0` | Transaction failed |

---

### Gas & Fees

> PecuNovus is **gasless**. Gas parameters are accepted for EVM/MetaMask compatibility but no fees are deducted from user balances.

---

#### `eth_gasPrice`

Returns a nominal gas price (1 gwei) for MetaMask compatibility.

**Returns:** `string` — `"0x3B9ACA00"` (1,000,000,000 wei = 1 gwei)

---

#### `eth_estimateGas`

Returns a fixed estimate of 21,000 gas (standard transfer).

**Params:** transaction object (ignored)

**Returns:** `string` — `"0x5208"` (21,000)

---

#### `eth_maxPriorityFeePerGas`

Returns `"0x3B9ACA00"` (1 gwei nominal).

---

#### `eth_feeHistory`

Returns a stub fee history. Base fee is always `0x0`.

**Params:**

| # | Type | Description |
|---|------|-------------|
| 0 | `number` | Block count |
| 1 | `string` | Newest block tag |
| 2 | `number[]` | Reward percentiles |

**Returns:** `FeeHistory`

---

### Contract / EVM Stubs

> PecuNovus is an **account-model chain with no EVM**. Contract methods return stubs for MetaMask compatibility.

---

#### `eth_getCode`

Returns `"0x"` — no smart contracts on the native PecuNovus chain.

---

#### `eth_getStorageAt`

Returns a 32-byte zero value.

---

#### `eth_call`

Handles a small set of read-only calls:

- **`latestAnswer()` selector (`0x50d25bcd`):** Returns the current PECU price in USD as a `uint256` with 8 decimals (Chainlink-compatible format).
- **All other calls:** Returns `"0x"`.

---

#### `eth_getLogs`

Returns `[]` — no EVM event logs on the native chain.

---

## Block Object Reference

| Field | Type | Description |
|-------|------|-------------|
| `number` | hex string |
| `hash` | hex string | 32-byte keccak256 block hash |
| `parentHash` | hex string | Previous block hash |
| `nonce` | hex string | Always `0x0000000000000000` (PoS-style) |
| `sha3Uncles` | hex string | Standard empty uncle hash |
| `logsBloom` | hex string | 256-byte zero bloom filter |
| `transactionsRoot` | hex string | Merkle root of transactions |
| `stateRoot` | hex string | State trie root |
| `receiptsRoot` | hex string | Receipts trie root |
| `miner` | address | Zero address (`0x000...000`) |
| `difficulty` | hex string | `0x0` (no PoW) |
| `totalDifficulty` | hex string | `0x0` |
| `extraData` | hex string | `0x` |
| `size` | hex string | `0x400` |
| `gasLimit` | hex string | `0x1DCD6500` (500,000,000) |
| `gasUsed` | hex string | Sum of gas used in block |
| `timestamp` | hex string | Unix timestamp (seconds) |
| `transactions` | string[] | Array of transaction hashes |
| `uncles` | string[] | Always `[]` |
| `baseFeePerGas` | hex string | `0x0` (gasless) |

---

## Transaction Object Reference

| Field | Type | Description |
|-------|------|-------------|
| `blockHash` | hex string | Hash of the containing block |
| `blockNumber` | hex string | Block number |
| `from` | address | Sender address |
| `gas` | hex string | `0x5208` (21,000) |
| `gasPrice` | hex string | `0x0` |
| `maxFeePerGas` | hex string | `0x0` |
| `maxPriorityFeePerGas` | hex string | `0x0` |
| `hash` | hex string | Transaction hash |
| `input` | hex string | `0x` (no calldata for PECU transfers) |
| `nonce` | hex string | Sender nonce at time of submission |
| `to` | address | Recipient address |
| `transactionIndex` | hex string | `0x0` |
| `value` | hex string | Amount in hex wei (18 decimals) |
| `type` | hex string | `0x2` (EIP-1559) |
| `chainId` | hex string | `0x19FAFB7` |
| `v`, `r`, `s` | hex string | Signature components |

---

## Receipt Object Reference

| Field | Type | Description |
|-------|------|-------------|
| `transactionHash` | hex string | TX hash |
| `transactionIndex` | hex string | `0x0` |
| `blockHash` | hex string | Block hash |
| `blockNumber` | hex string | Block number |
| `from` | address | Sender |
| `to` | address | Recipient |
| `cumulativeGasUsed` | hex string | `0x5208` |
| `gasUsed` | hex string | `0x5208` |
| `contractAddress` | null | Always null (no contract deployment) |
| `logs` | array | Always `[]` |
| `logsBloom` | hex string | 512-byte zero bloom |
| `type` | hex string | `0x2` |
| `status` | hex string | `0x1` = success, `0x0` = failure |
| `effectiveGasPrice` | hex string | `0x0` |
