const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const ProductRegistry = await hre.ethers.getContractFactory("ProductRegistry");
  const registry = await ProductRegistry.deploy();

  await registry.waitForDeployment();

  const address = await registry.getAddress();

  const envPath = path.join(__dirname, "..", "backend", ".env");

  const port = process.env.PORT || "5000";

  const envContent =
`PORT=${port}
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
CONTRACT_ADDRESS=${address}
`;

  fs.writeFileSync(envPath, envContent);

  console.log("ProductRegistry deployed to:", address);
  console.log("Created backend/.env");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});