/**
 * utils/index.ts
 * Utility helpers for working with the PecuNovus RPC.
 */

import { ethers } from 'ethers';

export const PECU_CHAIN_ID   = 27272727;
export const PECU_CHAIN_HEX  = '0x19FAFB7';
export const PECU_ENDPOINT   = 'https://mainnet.pecunovus.net/';
export const PECU_SYMBOL     = 'PECU';
export const PECU_DECIMALS   = 18;

// ─── Address Helpers ─────────────────────────────────────────────────────────

/** Normalise an address to lowercase with 0x prefix. */
export function normaliseAddress(address: string): string {
  return address.toLowerCase().startsWith('0x')
    ? address.toLowerCase()
    : '0x' + address.toLowerCase();
}

/** Check if a string is a valid Ethereum-style address. */
export function isValidAddress(address: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

// ─── Hex / Number Helpers ────────────────────────────────────────────────────

/** Convert hex block number to decimal. */
export function hexToDecimal(hex: string): number {
  return parseInt(hex, 16);
}

/** Convert decimal to 0x-prefixed hex. */
export function toHex(value: number | bigint): string {
  return '0x' + value.toString(16);
}

/** Parse hex wei to a PECU float string (fixed 6 decimal places). */
export function formatPecu(hexWei: string, decimals = 6): string {
  const wei = BigInt(hexWei);
  const pecu = Number(wei) / 1e18;
  return pecu.toFixed(decimals);
}

/** Convert a PECU amount (float) to hex wei. */
export function pecuToWei(amount: number): string {
  const wei = BigInt(Math.round(amount * 10 ** PECU_DECIMALS));
  return '0x' + wei.toString(16);
}

// ─── Transaction Helpers ─────────────────────────────────────────────────────

/**
 * Build and sign a PECU transfer transaction using ethers v6.
 *
 * @param privateKey  - sender's private key (0x-prefixed)
 * @param toAddress   - recipient address
 * @param amountPecu  - amount in PECU (e.g. 1.5)
 * @param nonce       - current nonce for the sender (from eth_getTransactionCount)
 * @returns           signed raw transaction hex ready for eth_sendRawTransaction
 */
export async function buildSignedTransfer(
  privateKey: string,
  toAddress: string,
  amountPecu: number,
  nonce: number,
): Promise<string> {
  const wallet = new ethers.Wallet(privateKey);
  const valueWei = ethers.parseUnits(amountPecu.toFixed(PECU_DECIMALS), PECU_DECIMALS);

  const tx = {
    type:                 2,          // EIP-1559
    chainId:              PECU_CHAIN_ID,
    nonce,
    to:                   toAddress,
    value:                valueWei,
    gasLimit:             21_000n,
    maxFeePerGas:         1_000_000_000n,  // 1 gwei (nominal; PecuNovus is gasless)
    maxPriorityFeePerGas: 1_000_000_000n,
  };

  return wallet.signTransaction(tx);
}

/**
 * Compute the keccak256 hash of a raw signed transaction.
 * This matches the hash that PecuNovus / MetaMask will use.
 */
export function computeTxHash(rawTx: string): string {
  const bytes = ethers.getBytes(rawTx);
  return ethers.keccak256(bytes);
}

/**
 * Poll for a transaction receipt until it appears or timeout is reached.
 *
 * @param fetchReceipt  - async function that fetches the receipt
 * @param intervalMs    - polling interval (default 2000ms)
 * @param timeoutMs     - give up after this many ms (default 60000ms)
 */
export async function waitForReceipt<T>(
  fetchReceipt: () => Promise<T | null>,
  intervalMs = 2_000,
  timeoutMs  = 60_000,
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const receipt = await fetchReceipt();
    if (receipt !== null) return receipt;
    await sleep(intervalMs);
  }
  throw new Error(`Receipt not found after ${timeoutMs / 1000}s`);
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── MetaMask / EIP-1193 Helpers ─────────────────────────────────────────────

/**
 * Add the PecuNovus network to MetaMask (or any EIP-1193 wallet).
 * Call this from a browser context where window.ethereum is available.
 */
export async function addPecuNetworkToMetaMask(): Promise<void> {
  const ethereum = (window as unknown as { ethereum?: { request: (args: unknown) => Promise<unknown> } }).ethereum;
  if (!ethereum) throw new Error('MetaMask not detected');

  await ethereum.request({
    method: 'wallet_addEthereumChain',
    params: [{
      chainId:           PECU_CHAIN_HEX,
      chainName:         'PecuNovus Mainnet',
      nativeCurrency:    { name: 'PECU', symbol: 'PECU', decimals: 18 },
      rpcUrls:           [PECU_ENDPOINT],
      blockExplorerUrls: ['https://pecunovus.net'],
    }],
  });
}

/**
 * Switch MetaMask to the PecuNovus network.
 */
export async function switchToPecuNetwork(): Promise<void> {
  const ethereum = (window as unknown as { ethereum?: { request: (args: unknown) => Promise<unknown> } }).ethereum;
  if (!ethereum) throw new Error('MetaMask not detected');

  await ethereum.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: PECU_CHAIN_HEX }],
  });
}
