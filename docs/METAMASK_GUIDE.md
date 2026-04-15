# MetaMask Integration Guide

This guide explains how to add PecuNovus to MetaMask and interact with it from a web application.

---

## 1. Network Parameters

Add these values when registering PecuNovus in MetaMask (manually or programmatically):

| Field | Value |
|-------|-------|
| Network Name | PecuNovus Mainnet |
| New RPC URL | `https://mainnet.pecunovus.net/` |
| Chain ID | `27272727` |
| Currency Symbol | `PECU` |
| Block Explorer URL | `https://pecunovus.net` |

---

## 2. Adding the Network Programmatically

Use `wallet_addEthereumChain` (EIP-3085):

```ts
await window.ethereum.request({
  method: 'wallet_addEthereumChain',
  params: [{
    chainId:           '0x19FAFB7',           // 27272727 in hex
    chainName:         'PecuNovus Mainnet',
    nativeCurrency:    { name: 'PECU', symbol: 'PECU', decimals: 18 },
    rpcUrls:           ['https://mainnet.pecunovus.net/'],
    blockExplorerUrls: ['https://pecunovus.net'],
  }],
});
```

If the network already exists, MetaMask will prompt the user to switch to it.

---

## 3. Switching to PecuNovus

Use `wallet_switchEthereumChain` (EIP-3326):

```ts
try {
  await window.ethereum.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: '0x19FAFB7' }],
  });
} catch (err) {
  if (err.code === 4902) {
    // Network not added yet — call wallet_addEthereumChain first
  }
}
```

---

## 4. Connecting a Wallet

```ts
const accounts = await window.ethereum.request({
  method: 'eth_requestAccounts',
});
const userAddress = accounts[0].toLowerCase();
```

---

## 5. Reading the Balance

Use `eth_getBalance` directly against the PecuNovus RPC:

```ts
const response = await fetch('https://mainnet.pecunovus.net/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method:  'eth_getBalance',
    params:  [userAddress, 'latest'],
    id:      1,
  }),
});
const { result } = await response.json();
const balancePecu = Number(BigInt(result)) / 1e18;
```

Or use ethers.js with a `JsonRpcProvider`:

```ts
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://mainnet.pecunovus.net/');
const balanceWei  = await provider.getBalance(userAddress);
const balancePecu = parseFloat(ethers.formatUnits(balanceWei, 18));
```

---

## 6. Sending PECU via MetaMask

MetaMask handles signing — you only need to call `eth_sendTransaction`:

```ts
const txHash = await window.ethereum.request({
  method: 'eth_sendTransaction',
  params: [{
    from:  senderAddress,
    to:    recipientAddress,
    value: '0x' + BigInt(Math.round(amountPecu * 1e18)).toString(16),
    gas:   '0x5208',   // 21,000
  }],
});
```

MetaMask will show a confirmation dialog. The user approves, MetaMask signs, and the raw transaction is sent to `https://mainnet.pecunovus.net/` via `eth_sendRawTransaction`.

---

## 7. Sending PECU Programmatically (No MetaMask)

For server-side or automated transfers, sign with ethers v6 and submit directly:

```ts
import { ethers } from 'ethers';

const wallet   = new ethers.Wallet(PRIVATE_KEY);
const provider = new ethers.JsonRpcProvider('https://mainnet.pecunovus.net/');
const walletWithProvider = wallet.connect(provider);

const tx = await walletWithProvider.sendTransaction({
  to:                   recipientAddress,
  value:                ethers.parseUnits('1.5', 18),
  gasLimit:             21_000n,
  maxFeePerGas:         1_000_000_000n,
  maxPriorityFeePerGas: 1_000_000_000n,
  chainId:              27272727,
});

const receipt = await tx.wait();
console.log('Confirmed in block', receipt.blockNumber);
```

---

## 8. Detecting Network Changes

Listen for the `chainChanged` event:

```ts
window.ethereum.on('chainChanged', (chainId) => {
  if (chainId !== '0x19FAFB7') {
    console.warn('Switched away from PecuNovus');
  }
  // MetaMask recommends reloading the page on chain change
  window.location.reload();
});
```

Listen for account changes:

```ts
window.ethereum.on('accountsChanged', (accounts) => {
  if (accounts.length === 0) {
    // User disconnected wallet
  } else {
    const newAddress = accounts[0].toLowerCase();
  }
});
```

---

## 9. Account Linking (Existing PecuNovus Users)

If your users already have PecuNovus accounts (email-based), they must **link** their MetaMask address to their existing account to access their PECU balance from MetaMask.

### Flow A — Email user links MetaMask

```
User is logged in with email JWT
  │
  ├─ POST /api/v2/erc20/auth/nonce    { address: "0x..." }
  │   └─ returns SIWE challenge message
  │
  ├─ MetaMask: personal_sign(message, address)
  │   └─ returns signature
  │
  └─ POST /api/v2/erc20/auth/claim
      Authorization: Bearer <email-JWT>
      Body: { address, signature, message }
      │
      └─ Links 0x address to existing account
         Returns upgraded JWT with eth_address
         Existing PECU balance is preserved
```

```ts
async function connectMetaMask(emailJwt: string) {
  const [address] = await window.ethereum.request({ method: 'eth_requestAccounts' });

  const { message } = await fetch('/api/v2/erc20/auth/nonce', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address }),
  }).then(r => r.json());

  const signature = await window.ethereum.request({
    method: 'personal_sign',
    params: [message, address],
  });

  const { token } = await fetch('/api/v2/erc20/auth/claim', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${emailJwt}`,
    },
    body: JSON.stringify({ address, signature, message }),
  }).then(r => r.json());

  localStorage.setItem('token', token);
}
```

### Flow B — New user, MetaMask only

```ts
async function loginWithMetaMask() {
  const [address] = await window.ethereum.request({ method: 'eth_requestAccounts' });

  const { message } = await fetch('/api/v2/erc20/auth/nonce', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address }),
  }).then(r => r.json());

  const signature = await window.ethereum.request({
    method: 'personal_sign',
    params: [message, address],
  });

  const { token, isNewUser } = await fetch('/api/v2/erc20/auth/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, signature, message }),
  }).then(r => r.json());

  localStorage.setItem('token', token);
}
```

**UI rule:** If the user is already logged in → show "Connect MetaMask" (calls `/auth/claim`). If not → show "Login with MetaMask" (calls `/auth/verify`).

---

## 10. Common Issues

### MetaMask shows transaction as "Pending" forever

The RPC bridge requires the sender's address to be registered in PecuNovus. If `eth_sendRawTransaction` returns an error (`-32000`), check:
- Is the sender's MetaMask address linked to a PecuNovus account?
- Does the sender have sufficient PECU balance?

### Wrong chain / "network mismatch"

Make sure the MetaMask chain ID matches `27272727`. If users are on Ethereum mainnet, call `wallet_switchEthereumChain` before any transaction.

### Balance shows 0 after sending

The balance is stored in MySQL, not on an EVM chain. The balance is accurate immediately after the transaction is confirmed, but requires the sender's address to be linked to a PecuNovus account.
