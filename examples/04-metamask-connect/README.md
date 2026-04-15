# Example 04 — MetaMask Connect (Browser)

A standalone HTML page that lets users add the PecuNovus network to MetaMask, connect their wallet, see their PECU balance, and send PECU.

## Run

Open the file directly in a browser (MetaMask extension must be installed):

```bash
open examples/04-metamask-connect/index.html
```

Or serve it locally:

```bash
npx serve examples/04-metamask-connect
```

## What it demonstrates

| Step | MetaMask / RPC call | Description |
|------|---------------------|-------------|
| 1 | `wallet_addEthereumChain` | Add PecuNovus network to MetaMask |
| 2 | `wallet_switchEthereumChain` | Switch to the PecuNovus chain |
| 3 | `eth_requestAccounts` | Get the connected wallet address |
| 4 | `eth_getBalance` | Fetch PECU balance |
| 5 | `eth_blockNumber` | Show current block height |
| 6 | `eth_sendTransaction` | Send PECU via MetaMask (MetaMask handles signing) |

## Network parameters for MetaMask

```
Network Name:    PecuNovus Mainnet
RPC URL:         https://mainnet.pecunovus.net/
Chain ID:        27272727  (hex: 0x19FAFB7)
Currency Symbol: PECU
Decimals:        18
Explorer URL:    https://pecunovus.net
```

You can also add the network manually in MetaMask Settings → Networks → Add a network.

## No framework needed

This example uses plain browser JavaScript with `fetch()` and the EIP-1193 `window.ethereum` API — no React, no npm build step.
