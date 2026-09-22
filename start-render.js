const { spawn } = require("child_process");

const hardhat = spawn(
  "npx",
  ["hardhat", "node", "--hostname", "127.0.0.1"],
  {
    stdio: "inherit",
    shell: true
  }
);

console.log("Starting local Hardhat blockchain...");

setTimeout(() => {
  console.log("Deploying smart contract...");

  const deploy = spawn(
    "npx",
    ["hardhat", "run", "scripts/deploy.js", "--network", "localhost"],
    {
      stdio: "inherit",
      shell: true
    }
  );

  deploy.on("close", (code) => {
    if (code !== 0) {
      console.error("Contract deployment failed.");
      process.exit(code);
    }

    console.log("Starting Express backend...");

    const server = spawn(
      "node",
      ["backend/server.js"],
      {
        stdio: "inherit",
        shell: true
      }
    );

    server.on("close", (code) => {
      hardhat.kill();
      process.exit(code || 0);
    });
  });
}, 8000);

process.on("SIGTERM", () => {
  hardhat.kill();
  process.exit(0);
});