/**
 * client/PecuRpcClient.ts
 * Low-level JSON-RPC 2.0 client for the PecuNovus mainnet endpoint.
 *
 * Endpoint: https://mainnet.pecunovus.net/
 * Chain ID:  27272727 (0x19FAFB7)
 * Symbol:    PECU
 */

import {
  PecuRpcClientConfig,
  JsonRpcRequest,
  JsonRpcResponse,
  Block,
  Transaction,
  TransactionReceipt,
  Log,
  LogFilter,
  FeeHistory,
  NetworkInfo,
  RpcMethod,
} from '../types';

const DEFAULT_ENDPOINT = 'https://mainnet.pecunovus.net/';
const DEFAULT_TIMEOUT  = 10_000;

export class PecuRpcClient {
  private readonly endpoint: string;
  private readonly authToken: string | undefined;
  private readonly timeout: number;
  private requestId = 0;

  constructor(config: PecuRpcClientConfig = {}) {
    this.endpoint  = (config.endpoint ?? DEFAULT_ENDPOINT).replace(/\/$/, '') + '/';
    this.authToken = config.authToken;
    this.timeout   = config.timeout ?? DEFAULT_TIMEOUT;
  }

  // ─── Low-level ─────────────────────────────────────────────────────────────

  /**
   * Send a single JSON-RPC request.
   */
  async call<T = unknown>(method: RpcMethod, params: unknown[] = []): Promise<T> {
    const id = ++this.requestId;
    const body: JsonRpcRequest = { jsonrpc: '2.0', method, params, id };

    const response = await this._fetch<JsonRpcResponse<T>>(body);

    if (response.error) {
      throw new RpcError(response.error.message, response.error.code, response.error.data);
    }
    return response.result as T;
  }

  /**
   * Send multiple JSON-RPC requests in a single HTTP call (batch).
   */
  async batch<T = unknown>(requests: { method: RpcMethod; params?: unknown[] }[]): Promise<T[]> {
    const bodies: JsonRpcRequest[] = requests.map(r => ({
      jsonrpc: '2.0',
      method: r.method,
      params: r.params ?? [],
      id: ++this.requestId,
    }));

    const responses = await this._fetch<JsonRpcResponse<T>[]>(bodies);
    return responses.map(r => {
      if (r.error) throw new RpcError(r.error.message, r.error.code);
      return r.result as T;
    });
  }

  private async _fetch<T>(body: unknown): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.authToken) headers['Authorization'] = `Bearer ${this.authToken}`;

    try {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      return (await res.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  // ─── Network ───────────────────────────────────────────────────────────────

  /** Returns PecuNovus chain ID as hex string (e.g. "0x19FAFB7"). */
  async getChainId(): Promise<string> {
    return this.call<string>('eth_chainId');
  }

  /** Returns chain ID as decimal string. */
  async getNetworkVersion(): Promise<string> {
    return this.call<string>('net_version');
  }

  /** Always returns true — the node is always listening. */
  async isListening(): Promise<boolean> {
    return this.call<boolean>('net_listening');
  }

  /** Returns the node's client version string. */
  async getClientVersion(): Promise<string> {
    return this.call<string>('web3_clientVersion');
  }

  /** Fetch network metadata via the REST GET endpoint. */
  async getNetworkInfo(): Promise<NetworkInfo> {
    const res = await fetch(this.endpoint, { method: 'GET' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<NetworkInfo>;
  }

  // ─── Blocks ────────────────────────────────────────────────────────────────

  /** Returns the latest block number as hex. */
  async getBlockNumber(): Promise<string> {
    return this.call<string>('eth_blockNumber');
  }

  /** Returns the latest block number as a JS number. */
  async getBlockNumberDecimal(): Promise<number> {
    const hex = await this.getBlockNumber();
    return parseInt(hex, 16);
  }

  /**
   * Get a block by number.
   * @param blockTag - hex block number, 'latest', 'earliest', or 'pending'
   * @param fullTx   - if true, includes full tx objects (not just hashes)
   */
  async getBlockByNumber(blockTag: string | 'latest' | 'earliest' | 'pending', fullTx = false): Promise<Block | null> {
    return this.call<Block | null>('eth_getBlockByNumber', [blockTag, fullTx]);
  }

  /**
   * Get a block by its hash.
   * @param blockHash - 0x-prefixed 32-byte hex
   */
  async getBlockByHash(blockHash: string, fullTx = false): Promise<Block | null> {
    return this.call<Block | null>('eth_getBlockByHash', [blockHash, fullTx]);
  }

  // ─── Accounts & Balances ───────────────────────────────────────────────────

  /**
   * Get the PECU balance of an address.
   * Returns hex wei (18 decimals). Use `formatBalance` to convert to PECU.
   */
  async getBalance(address: string, blockTag = 'latest'): Promise<string> {
    return this.call<string>('eth_getBalance', [address.toLowerCase(), blockTag]);
  }

  /**
   * Get the PECU balance of an address as a human-readable number.
   */
  async getBalancePecu(address: string): Promise<number> {
    const hexWei = await this.getBalance(address);
    return hexWeiToPecu(hexWei);
  }

  /**
   * Get the transaction count (nonce) for an address.
   */
  async getTransactionCount(address: string, blockTag = 'latest'): Promise<number> {
    const hex = await this.call<string>('eth_getTransactionCount', [address.toLowerCase(), blockTag]);
    return parseInt(hex, 16);
  }

  // ─── Transactions ──────────────────────────────────────────────────────────

  /**
   * Broadcast a signed raw transaction.
   * @param rawTx - 0x-prefixed RLP-encoded signed transaction hex
   * @returns Transaction hash
   */
  async sendRawTransaction(rawTx: string): Promise<string> {
    return this.call<string>('eth_sendRawTransaction', [rawTx]);
  }

  /** Get a transaction by its hash. */
  async getTransactionByHash(txHash: string): Promise<Transaction | null> {
    return this.call<Transaction | null>('eth_getTransactionByHash', [txHash]);
  }

  /** Get the receipt for a mined transaction. Returns null if pending. */
  async getTransactionReceipt(txHash: string): Promise<TransactionReceipt | null> {
    return this.call<TransactionReceipt | null>('eth_getTransactionReceipt', [txHash]);
  }

  // ─── Gas ───────────────────────────────────────────────────────────────────

  /**
   * Get the current gas price in hex wei.
   * PecuNovus is effectively gasless; this returns a nominal 1 gwei.
   */
  async getGasPrice(): Promise<string> {
    return this.call<string>('eth_gasPrice');
  }

  /**
   * Estimate gas for a transaction.
   * Always returns 21000 on PecuNovus (standard transfer).
   */
  async estimateGas(txParams: Record<string, string>): Promise<string> {
    return this.call<string>('eth_estimateGas', [txParams]);
  }

  /** Returns fee history (stub — PecuNovus has no fee market). */
  async getFeeHistory(blockCount: number, newestBlock: string, rewardPercentiles: number[]): Promise<FeeHistory> {
    return this.call<FeeHistory>('eth_feeHistory', [blockCount, newestBlock, rewardPercentiles]);
  }

  // ─── Misc ──────────────────────────────────────────────────────────────────

  /** Returns false — PecuNovus node is always synced. */
  async isSyncing(): Promise<false> {
    return this.call<false>('eth_syncing');
  }

  /** Get contract bytecode at an address. Always '0x' on PecuNovus. */
  async getCode(address: string, blockTag = 'latest'): Promise<string> {
    return this.call<string>('eth_getCode', [address, blockTag]);
  }

  /**
   * Get event logs matching a filter.
   * Returns an empty array on the native PecuNovus chain (no EVM).
   */
  async getLogs(filter: LogFilter): Promise<Log[]> {
    return this.call<Log[]>('eth_getLogs', [filter]);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert hex wei to PECU float (18 decimals). */
export function hexWeiToPecu(hexWei: string): number {
  const wei = BigInt(hexWei);
  const pecu = Number(wei) / 1e18;
  return pecu;
}

/** Convert PECU float to hex wei string. */
export function pecuToHexWei(pecu: number): string {
  const wei = BigInt(Math.round(pecu * 1e18));
  return '0x' + wei.toString(16);
}

// ─── Error ────────────────────────────────────────────────────────────────────

export class RpcError extends Error {
  constructor(
    message: string,
    public readonly code: number,
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = 'RpcError';
  }
}
