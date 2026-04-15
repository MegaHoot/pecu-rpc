/**
 * Example 02: Send PECU Transaction
 * ─────────────────────────────────────────────────────────────────────────────
 * Signs and broadcasts a PECU transfer transaction, then polls for its receipt.
 *
 * Usage:
 *   PRIVATE_KEY=0x... npx ts-node examples/02-send-transaction/index.ts \
 *     --to   0xRECIPIENT \
 *     --amount 0.5
 *
 * ⚠️  NEVER commit or expose your private key.
 *     Use environment variables or a secrets manager in production.
 *
 * What it shows:
 *   - Fetching the sender's nonce (eth_getTransactionCount)
 *   - Building an EIP-1559 transaction with ethers v6
 *   - Signing locally (private key never leaves the client)
 *   - Broadcasting via eth_sendRawTransaction
 *   - Polling for the receipt with eth_getTransactionReceipt
 */

import { ethers } from 'ethers';
import { PecuRpcClient } from '../../src/client/PecuRpcClient';
import { buildSignedTransfer, waitForReceipt, PECU_CHAIN_ID } from '../../src/utils';

const ENDPOINT = 'https://mainnet.pecunovus.net/';

// ─── CLI arg parsing (minimal) ────────────────────────────────────────────────

function parseArgs(): { to: string; amount: number } {
  const args = process.argv.slice(2);
  const get  = (flag: string) => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  const to     = get('--to');
  const amount = parseFloat(get('--amount') ?? '');

  if (!to || !/^0x[0-9a-fA-F]{40}$/.test(to)) {
    console.error('Error: --to must be a valid 0x address');
    process.exit(1);
  }
  if (isNaN(amount) || amount <= 0) {
    console.error('Error: --amount must be a positive number');
    process.exit(1);
  }

  return { to, amount };
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const { to, amount } = parseArgs();

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error('Error: PRIVATE_KEY environment variable is required');
    console.error('  export PRIVATE_KEY=0x...');
    process.exit(1);
  }

  const wallet = new ethers.Wallet(privateKey);
  const from   = wallet.address.toLowerCase();
  const client = new PecuRpcClient({ endpoint: ENDPOINT });

  console.log('PecuNovus RPC — Send Transaction');
  console.log('─'.repeat(50));
  console.log(`From:    ${from}`);
  console.log(`To:      ${to}`);
  console.log(`Amount:  ${amount} PECU`);
  console.log(`Chain:   ${PECU_CHAIN_ID} (PecuNovus Mainnet)`);
  console.log('─'.repeat(50));

  // ── Step 1: Check balance ─────────────────────────────────────────────────
  const balancePecu = await client.getBalancePecu(from);
  console.log(`Sender balance: ${balancePecu.toFixed(6)} PECU`);
  if (balancePecu < amount) {
    console.error(`Insufficient balance: need ${amount} PECU, have ${balancePecu.toFixed(6)}`);
    process.exit(1);
  }

  // ── Step 2: Get nonce ─────────────────────────────────────────────────────
  const nonce = await client.getTransactionCount(from);
  console.log(`Nonce: ${nonce}`);

  // ── Step 3: Build & sign ──────────────────────────────────────────────────
  console.log('\nSigning transaction...');
  const rawTx = await buildSignedTransfer(privateKey, to, amount, nonce);
  console.log(`Signed tx (first 60 chars): ${rawTx.slice(0, 60)}...`);

  // ── Step 4: Broadcast ─────────────────────────────────────────────────────
  console.log('\nBroadcasting...');
  const txHash = await client.sendRawTransaction(rawTx);
  console.log(`✅ Submitted!`);
  console.log(`   TX Hash: ${txHash}`);

  // ── Step 5: Wait for receipt ──────────────────────────────────────────────
  console.log('\nWaiting for confirmation...');
  const receipt = await waitForReceipt(
    () => client.getTransactionReceipt(txHash),
    2_000,
    60_000,
  );

  console.log('\n✅ Confirmed!');
  console.log(`   Block:  #${parseInt(receipt.blockNumber, 16)}`);
  console.log(`   Status: ${receipt.status === '0x1' ? 'SUCCESS' : 'FAILED'}`);
  console.log(`   Gas:    ${parseInt(receipt.gasUsed, 16)}`);
}

main().catch(err => {
  console.error('Error:', err.message ?? err);
  process.exit(1);
});
