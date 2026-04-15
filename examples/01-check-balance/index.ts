/**
 * Example 01: Check PECU Balance
 * ─────────────────────────────────────────────────────────────────────────────
 * Demonstrates how to query the balance of any address on PecuNovus.
 *
 * Usage:
 *   npx ts-node examples/01-check-balance/index.ts 0xYOUR_ADDRESS
 *
 * What it shows:
 *   - Creating a PecuRpcClient
 *   - Fetching network info (chain ID, symbol)
 *   - Querying eth_getBalance
 *   - Decoding hex wei → PECU float
 *   - Querying the latest block number
 */

import { PecuRpcClient } from '../../src/client/PecuRpcClient';
import { formatPecu, hexToDecimal } from '../../src/utils';

const ENDPOINT = 'https://mainnet.pecunovus.net/';

async function main() {
  const address = process.argv[2];
  if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
    console.error('Usage: npx ts-node examples/01-check-balance/index.ts 0xADDRESS');
    process.exit(1);
  }

  const client = new PecuRpcClient({ endpoint: ENDPOINT });

  // ── 1. Fetch network metadata ─────────────────────────────────────────────
  const info = await client.getNetworkInfo();
  console.log('Network:', info.name, `v${info.version}`);
  console.log('Chain ID:', info.chainId, `(hex: 0x${info.chainId.toString(16).toUpperCase()})`);
  console.log('Symbol: ', info.symbol);
  console.log('─'.repeat(50));

  // ── 2. Latest block ───────────────────────────────────────────────────────
  const blockHex = await client.getBlockNumber();
  const blockNum = hexToDecimal(blockHex);
  console.log(`Latest block: #${blockNum} (${blockHex})`);

  // ── 3. Balance ────────────────────────────────────────────────────────────
  const balanceHex = await client.getBalance(address);
  const balancePecu = formatPecu(balanceHex, 8);

  console.log(`\nAddress: ${address}`);
  console.log(`Balance (hex wei): ${balanceHex}`);
  console.log(`Balance (PECU):    ${balancePecu} PECU`);

  // ── 4. Transaction count (nonce) ──────────────────────────────────────────
  const nonce = await client.getTransactionCount(address);
  console.log(`Nonce (tx count):  ${nonce}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
