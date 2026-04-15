/**
 * Example 03: Block Explorer (CLI)
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches and displays recent blocks and their transactions from PecuNovus.
 *
 * Usage:
 *   # Show last 5 blocks
 *   npx ts-node examples/03-block-explorer/index.ts
 *
 *   # Show a specific block by number
 *   npx ts-node examples/03-block-explorer/index.ts --block 6053000
 *
 *   # Show a transaction by hash
 *   npx ts-node examples/03-block-explorer/index.ts --tx 0xHASH
 *
 * What it shows:
 *   - eth_blockNumber
 *   - eth_getBlockByNumber
 *   - eth_getTransactionByHash
 *   - eth_getTransactionReceipt
 *   - Batch RPC calls
 */

import { PecuRpcClient } from '../../src/client/PecuRpcClient';
import { formatPecu, hexToDecimal } from '../../src/utils';
import type { Block, Transaction, TransactionReceipt } from '../../src/types';

const ENDPOINT = 'https://mainnet.pecunovus.net/';
const DEFAULT_BLOCKS = 5;

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatTimestamp(hexTs: string): string {
  const ts = hexToDecimal(hexTs);
  return new Date(ts * 1000).toISOString();
}

function printBlock(block: Block): void {
  const num = hexToDecimal(block.number);
  const ts  = formatTimestamp(block.timestamp);
  console.log(`\n┌── Block #${num} ${'─'.repeat(Math.max(0, 46 - String(num).length))}`);
  console.log(`│  Hash:        ${block.hash}`);
  console.log(`│  Parent:      ${block.parentHash}`);
  console.log(`│  Timestamp:   ${ts}`);
  console.log(`│  Miner:       ${block.miner}`);
  console.log(`│  Gas Used:    ${hexToDecimal(block.gasUsed).toLocaleString()}`);
  console.log(`│  Gas Limit:   ${hexToDecimal(block.gasLimit).toLocaleString()}`);
  console.log(`│  Txs:         ${block.transactions.length}`);
  if (block.transactions.length > 0) {
    console.log('│  Transaction hashes:');
    block.transactions.slice(0, 5).forEach(h => console.log(`│    ${h}`));
    if (block.transactions.length > 5) {
      console.log(`│    ... and ${block.transactions.length - 5} more`);
    }
  }
  console.log('└' + '─'.repeat(50));
}

function printTransaction(tx: Transaction, receipt?: TransactionReceipt | null): void {
  const blockNum = hexToDecimal(tx.blockNumber);
  const valueStr = formatPecu(tx.value, 8);
  console.log(`\n┌── Transaction ${'─'.repeat(35)}`);
  console.log(`│  Hash:    ${tx.hash}`);
  console.log(`│  From:    ${tx.from}`);
  console.log(`│  To:      ${tx.to ?? '(contract creation)'}`);
  console.log(`│  Value:   ${valueStr} PECU`);
  console.log(`│  Nonce:   ${hexToDecimal(tx.nonce)}`);
  console.log(`│  Block:   #${blockNum}`);
  console.log(`│  Gas:     ${hexToDecimal(tx.gas).toLocaleString()}`);
  console.log(`│  Type:    ${tx.type}`);

  if (receipt) {
    const status = receipt.status === '0x1' ? '✅ SUCCESS' : '❌ FAILED';
    console.log(`│  Status:  ${status}`);
    console.log(`│  Gas Used: ${hexToDecimal(receipt.gasUsed).toLocaleString()}`);
  }
  console.log('└' + '─'.repeat(50));
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const get  = (flag: string) => {
    const i = args.indexOf(flag);
    return i !== -1 ? args[i + 1] : undefined;
  };

  const client = new PecuRpcClient({ endpoint: ENDPOINT });

  // ── Mode A: specific transaction ─────────────────────────────────────────
  const txHash = get('--tx');
  if (txHash) {
    console.log(`Fetching transaction ${txHash}...`);
    const [tx, receipt] = await Promise.all([
      client.getTransactionByHash(txHash),
      client.getTransactionReceipt(txHash),
    ]);
    if (!tx) { console.error('Transaction not found'); process.exit(1); }
    printTransaction(tx, receipt);
    return;
  }

  // ── Mode B: specific block ────────────────────────────────────────────────
  const blockArg = get('--block');
  if (blockArg) {
    const blockTag = '0x' + parseInt(blockArg).toString(16);
    console.log(`Fetching block ${blockArg}...`);
    const block = await client.getBlockByNumber(blockTag);
    if (!block) { console.error('Block not found'); process.exit(1); }
    printBlock(block);
    return;
  }

  // ── Mode C: latest N blocks (default) ────────────────────────────────────
  const latestNum = await client.getBlockNumberDecimal();
  console.log(`PecuNovus Block Explorer`);
  console.log(`Latest block: #${latestNum}`);
  console.log(`Fetching last ${DEFAULT_BLOCKS} blocks via batch call...`);

  // Use the batch API to fetch all blocks in a single HTTP request
  const blockNumbers = Array.from(
    { length: DEFAULT_BLOCKS },
    (_, i) => latestNum - (DEFAULT_BLOCKS - 1 - i),
  );

  const requests = blockNumbers.map(n => ({
    method: 'eth_getBlockByNumber' as const,
    params: ['0x' + n.toString(16), false],
  }));

  const blocks = await client.batch<Block | null>(requests);

  for (const block of blocks) {
    if (block) printBlock(block);
  }
}

main().catch(err => {
  console.error('Error:', err.message ?? err);
  process.exit(1);
});
