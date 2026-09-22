const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const ProductRegistry = await hre.ethers.getContractFactory("ProductRegistry");
  const registry = await ProductRegistry.deploy();

  await registry.waitForDeployment();

  const address = await registry.getAddress();

  const envPath = path.join(__dirname, "..", "backend", ".env");
  const envContent =
`PORT=5000
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=PASTE_YOUR_HARDHAT_PRIVATE_KEY_HERE
CONTRACT_ADDRESS=${address}
`;

  fs.writeFileSync(envPath, envContent);

  console.log("ProductRegistry deployed to:", address);
  console.log("Created backend/.env");
  console.log("IMPORTANT: Replace PRIVATE_KEY with a private key printed by 'npx hardhat node'.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
