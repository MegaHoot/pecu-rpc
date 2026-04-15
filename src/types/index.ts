/**
 * types/index.ts
 * All TypeScript types for the PecuNovus JSON-RPC protocol.
 */

// ─── JSON-RPC 2.0 Base ───────────────────────────────────────────────────────

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params?: unknown[];
  id: number | string | null;
}

export interface JsonRpcResponse<T = unknown> {
  jsonrpc: '2.0';
  id: number | string | null;
  result?: T;
  error?: JsonRpcError;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

// ─── RPC Method Names ────────────────────────────────────────────────────────

export type RpcMethod =
  // Network
  | 'eth_chainId'
  | 'net_version'
  | 'net_listening'
  | 'net_peerCount'
  | 'web3_clientVersion'
  // Blocks
  | 'eth_blockNumber'
  | 'eth_getBlockByNumber'
  | 'eth_getBlockByHash'
  // Accounts
  | 'eth_accounts'
  | 'eth_requestAccounts'
  | 'eth_getBalance'
  // Transactions
  | 'eth_getTransactionCount'
  | 'eth_sendRawTransaction'
  | 'eth_getTransactionByHash'
  | 'eth_getTransactionReceipt'
  // Gas
  | 'eth_gasPrice'
  | 'eth_estimateGas'
  | 'eth_maxPriorityFeePerGas'
  | 'eth_feeHistory'
  // Contract/call
  | 'eth_getCode'
  | 'eth_call'
  | 'eth_getLogs'
  | 'eth_getStorageAt'
  // Sync
  | 'eth_syncing';

// ─── Block ───────────────────────────────────────────────────────────────────

export interface Block {
  number: string;                 // hex
  hash: string;                   // 0x-prefixed 32-byte hex
  parentHash: string;
  nonce: string;
  sha3Uncles: string;
  logsBloom: string;
  transactionsRoot: string;
  stateRoot: string;
  receiptsRoot: string;
  miner: string;
  difficulty: string;             // hex
  totalDifficulty: string;        // hex
  extraData: string;
  size: string;                   // hex
  gasLimit: string;               // hex
  gasUsed: string;                // hex
  timestamp: string;              // hex Unix seconds
  transactions: string[];         // array of tx hashes
  uncles: string[];
  baseFeePerGas: string;
}

// ─── Transaction ─────────────────────────────────────────────────────────────

export interface Transaction {
  blockHash: string;
  blockNumber: string;            // hex
  from: string;
  gas: string;                    // hex
  gasPrice: string;               // hex
  maxFeePerGas: string;           // hex (EIP-1559)
  maxPriorityFeePerGas: string;   // hex (EIP-1559)
  hash: string;
  input: string;
  nonce: string;                  // hex
  to: string | null;
  transactionIndex: string;       // hex
  value: string;                  // hex wei
  type: string;                   // '0x2' = EIP-1559
  chainId: string;                // hex
  v: string;
  r: string;
  s: string;
}

// ─── Transaction Receipt ─────────────────────────────────────────────────────

export interface TransactionReceipt {
  transactionHash: string;
  transactionIndex: string;
  blockHash: string;
  blockNumber: string;
  from: string;
  to: string | null;
  cumulativeGasUsed: string;
  gasUsed: string;
  contractAddress: string | null;
  logs: Log[];
  logsBloom: string;
  type: string;
  status: string;                 // '0x1' = success, '0x0' = failure
  effectiveGasPrice: string;
}

// ─── Log ─────────────────────────────────────────────────────────────────────

export interface Log {
  address: string;
  topics: string[];
  data: string;
  blockNumber: string;
  transactionHash: string;
  transactionIndex: string;
  blockHash: string;
  logIndex: string;
  removed: boolean;
}

// ─── Log Filter ──────────────────────────────────────────────────────────────

export interface LogFilter {
  fromBlock?: string;
  toBlock?: string;
  address?: string | string[];
  topics?: (string | string[] | null)[];
  blockHash?: string;
}

// ─── Fee History ─────────────────────────────────────────────────────────────

export interface FeeHistory {
  oldestBlock: string;
  reward: string[][];
  baseFeePerGas: string[];
  gasUsedRatio: number[];
}

// ─── Network Info (GET /) ─────────────────────────────────────────────────────

export interface NetworkInfo {
  name: string;
  version: string;
  chainId: number;
  symbol: string;
  iconUrl: string;
}

// ─── Client Config ───────────────────────────────────────────────────────────

export interface PecuRpcClientConfig {
  /** Base URL of the PecuNovus RPC node. Default: https://mainnet.pecunovus.net */
  endpoint?: string;
  /** Optional Bearer token for authenticated endpoints */
  authToken?: string;
  /** Request timeout in ms. Default: 10_000 */
  timeout?: number;
}
