/**
 * Example 05: Wallet Dashboard
 * ─────────────────────────────────────────────────────────────────────────────
 * A comprehensive CLI dashboard showing network health, block stats,
 * and wallet information for a list of addresses.
 *
 * Usage:
 *   npx ts-node examples/05-wallet-dashboard/index.ts \
 *     0xADDR1 0xADDR2 0xADDR3
 *
 * What it shows:
 *   - Network health check (chainId, version, sync status)
 *   - Block statistics (latest block, estimated block time)
 *   - Batch balance lookup for multiple addresses
 *   - Transaction history inspection
 *   - Demonstrates all major RPC read methods in one place
 */

import { PecuRpcClient } from '../../src/client/PecuRpcClient';
import { formatPecu, hexToDecimal } from '../../src/utils';
import type { Block } from '../../src/types';

const ENDPOINT = 'https://mainnet.pecunovus.net/';
const HISTORY_BLOCKS = 10; // for block-time estimation

// ─── Display Helpers ──────────────────────────────────────────────────────────

const LINE  = '═'.repeat(60);
const DLINE = '─'.repeat(60);

function header(title: string) {
  console.log('\n' + LINE);
  console.log(`  ${title}`);
  console.log(LINE);
}

function row(label: string, value: string | number) {
  const padded = String(label).padEnd(24);
  console.log(`  ${padded} ${value}`);
}

// ─── Network Health ───────────────────────────────────────────────────────────

async function showNetworkHealth(client: PecuRpcClient) {
  header('🌐  Network Health');

  const [chainHex, version, isListening, isSyncing, clientVer, networkInfo] = await Promise.all([
    client.getChainId(),
    client.getNetworkVersion(),
    client.isListening(),
    client.isSyncing(),
    client.getClientVersion(),
    client.getNetworkInfo(),
  ]);

  row('Network',      networkInfo.name + ' v' + networkInfo.version);
  row('Symbol',       networkInfo.symbol);
  row('Chain ID',     `${parseInt(chainHex, 16)} (${chainHex})`);
  row('Net version',  version);
  row('Client',       clientVer);
  row('Listening',    isListening ? '✅ yes' : '❌ no');
  row('Syncing',      isSyncing   ? '🔄 yes' : '✅ no (up to date)');
}

// ─── Block Stats ──────────────────────────────────────────────────────────────

async function showBlockStats(client: PecuRpcClient) {
  header('📦  Block Statistics');

  const latestNum = await client.getBlockNumberDecimal();
  row('Latest block', `#${latestNum.toLocaleString()}`);

  // Fetch last N blocks to estimate block time
  const requests = Array.from({ length: HISTORY_BLOCKS }, (_, i) => ({
    method: 'eth_getBlockByNumber' as const,
    params: ['0x' + (latestNum - i).toString(16), false],
  }));

  const blocks = await client.batch<Block | null>(requests);
  const valid  = blocks.filter(Boolean) as Block[];

  if (valid.length >= 2) {
    const newest  = hexToDecimal(valid[0].timestamp);
    const oldest  = hexToDecimal(valid[valid.length - 1].timestamp);
    const avgTime = (newest - oldest) / (valid.length - 1);

    row('Avg block time', `${avgTime.toFixed(1)}s (last ${valid.length} blocks)`);
    row('Latest hash',    valid[0].hash.slice(0, 20) + '...');
    row('Gas limit',      parseInt(valid[0].gasLimit, 16).toLocaleString());

    const txCounts  = valid.map(b => b.transactions.length);
    const totalTxs  = txCounts.reduce((a, b) => a + b, 0);
    const avgTxs    = (totalTxs / valid.length).toFixed(1);
    row('Avg txs/block', `${avgTxs} (last ${valid.length} blocks)`);
  }
}

// ─── Wallet Info ──────────────────────────────────────────────────────────────

async function showWallets(client: PecuRpcClient, addresses: string[]) {
  header('👛  Wallet Balances');

  // Batch all balance + nonce requests in one HTTP call
  const requests = addresses.flatMap(addr => [
    { method: 'eth_getBalance' as const,          params: [addr.toLowerCase(), 'latest'] },
    { method: 'eth_getTransactionCount' as const, params: [addr.toLowerCase(), 'latest'] },
  ]);

  const results = await client.batch<string>(requests);

  console.log(DLINE);
  for (let i = 0; i < addresses.length; i++) {
    const addr     = addresses[i];
    const balHex   = results[i * 2];
    const nonceHex = results[i * 2 + 1];
    const balance  = formatPecu(balHex, 6);
    const nonce    = parseInt(nonceHex, 16);

    console.log(`\n  Address: ${addr}`);
    row('  Balance', `${balance} PECU`);
    row('  Nonce',   `${nonce} txs sent`);
  }
  console.log('\n' + DLINE);
}

// ─── Gas / Fee Info ───────────────────────────────────────────────────────────

async function showFeeInfo(client: PecuRpcClient) {
  header('⛽  Fee Information');

  const [gasPrice, latestHex] = await Promise.all([
    client.getGasPrice(),
    client.getBlockNumber(),
  ]);

  const gasPriceGwei = parseInt(gasPrice, 16) / 1e9;
  const feeHistory   = await client.getFeeHistory(3, latestHex, [50]);

  row('Gas price',      `${gasPriceGwei} gwei (nominal — PecuNovus is gasless)`);
  row('Estimate (xfer)', `21,000 gas`);
  row('Base fee',       feeHistory.baseFeePerGas[0] === '0x0' ? '0 gwei (gasless)' : feeHistory.baseFeePerGas[0]);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const addresses = process.argv.slice(2).filter(a => /^0x[0-9a-fA-F]{40}$/i.test(a));

  if (addresses.length === 0) {
    console.log('Usage: npx ts-node examples/05-wallet-dashboard/index.ts 0xADDR1 [0xADDR2 ...]');
    console.log('\nRunning network-only dashboard (no addresses provided)...');
  }

  const client = new PecuRpcClient({ endpoint: ENDPOINT });

  console.log('\n🔷  PecuNovus Mainnet Dashboard');
  console.log(`   Endpoint: ${ENDPOINT}`);
  console.log(`   Time:     ${new Date().toISOString()}`);

  await showNetworkHealth(client);
  await showBlockStats(client);
  await showFeeInfo(client);

  if (addresses.length > 0) {
    await showWallets(client, addresses);
  }

  console.log('\n' + LINE + '\n');
}

main().catch(err => {
  console.error('Error:', err.message ?? err);
  process.exit(1);
});
