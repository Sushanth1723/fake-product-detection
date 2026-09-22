# Fake Product Detection using Blockchain

A full-stack college-project MVP for detecting counterfeit products using a blockchain-backed product registry.

## Architecture

Frontend (React + Vite)
        |
        v
Backend API (Node.js + Express)
        |
        +---- JSON file for product metadata
        |
        +---- ethers.js
                |
                v
        Local Ethereum blockchain
        (Hardhat)
                |
                v
        ProductRegistry.sol

## Main features

- Manufacturer/admin can register products.
- Every registered product receives a unique product ID.
- Product information is written to a smart contract.
- Customer scans/enters a product code and verifies authenticity.
- Backend reads the blockchain and returns verification status.
- Product metadata and blockchain transaction hash are shown.
- Dashboard shows registered products and statistics.
- No MongoDB or SQL database is required for this MVP.

## Requirements

- Node.js 20+ recommended
- npm
- VS Code

## 1. Install backend/blockchain dependencies

Open a terminal in the project root:

```powershell
npm install
```

## 2. Compile the smart contract

```powershell
npm run chain:compile
```

## 3. Start a local blockchain

Open Terminal 1:

```powershell
npm run chain:node
```

Keep this terminal running.

## 4. Deploy the contract

Open Terminal 2:

```powershell
npm run chain:deploy
```

The deploy script automatically writes the contract address to:

`backend/.env`

## 5. Start the backend

Open Terminal 2:

```powershell
npm run server
```

Backend:

`http://localhost:5000`

## 6. Start the frontend

Open Terminal 3:

```powershell
cd frontend
npm install
npm run dev
```

Frontend:

`http://localhost:5173`

## Demo workflow

### Register a product

Use the Register Product page:

- Product name
- Brand
- Manufacturer
- Category
- Batch number
- Manufacturing date
- Expiry date

Click **Register Product**.

The backend creates a blockchain transaction and returns:

- Product ID
- Transaction hash
- Blockchain block number

### Verify a product

Enter the Product ID on the Verify page.

The system checks the smart contract.

Possible results:

- AUTHENTIC — product exists and is active.
- NOT FOUND — product does not exist.
- REVOKED — product was registered but later revoked.

## Important project note

This MVP demonstrates blockchain-based product registration and verification. A real production system should additionally use tamper-resistant QR/NFC labels, manufacturer wallets, role-based smart-contract permissions, decentralized storage, secure key management, audit logs, and a public blockchain/testnet.
