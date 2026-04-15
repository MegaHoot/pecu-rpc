# Example 03 — Block Explorer (CLI)

A command-line block explorer for PecuNovus. Inspect recent blocks, specific blocks by number, or individual transactions.

## Run

```bash
# Show the 5 most recent blocks
npx ts-node examples/03-block-explorer/index.ts

# Show a specific block by decimal number
npx ts-node examples/03-block-explorer/index.ts --block 6053000

# Show a transaction and its receipt
npx ts-node examples/03-block-explorer/index.ts --tx 0xTX_HASH
```

## What it demonstrates

| Step | RPC Method | Description |
|------|-----------|-------------|
| 1 | `eth_blockNumber` | Get latest block number |
| 2 | `eth_getBlockByNumber` (batch) | Fetch multiple blocks in one HTTP request |
| 3 | `eth_getBlockByNumber` | Fetch a single block by number |
| 4 | `eth_getTransactionByHash` | Fetch a transaction |
| 5 | `eth_getTransactionReceipt` | Fetch the transaction receipt |

## Batch calls

Instead of sending N separate HTTP requests for N blocks, you can use the batch API:

```ts
const requests = blockNumbers.map(n => ({
  method: 'eth_getBlockByNumber' as const,
  params: ['0x' + n.toString(16), false],
}));

// Single HTTP request, array of results
const blocks = await client.batch<Block | null>(requests);
```

This is far more efficient for explorers or dashboards that need to display multiple blocks at once.
