const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { ethers } = require("ethers");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const ABI = require("./contract.json").abi;
const dataFile = path.join(__dirname, "products.json");

if (!PRIVATE_KEY || PRIVATE_KEY.includes("PASTE_")) {
  console.warn("WARNING: backend/.env PRIVATE_KEY is not configured.");
}
if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS.includes("PASTE_")) {
  console.warn("WARNING: backend/.env CONTRACT_ADDRESS is not configured.");
}

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = PRIVATE_KEY && !PRIVATE_KEY.includes("PASTE_")
  ? new ethers.Wallet(PRIVATE_KEY, provider)
  : null;

const contract = wallet && CONTRACT_ADDRESS
  ? new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet)
  : null;

function readProducts() {
  try {
    return JSON.parse(fs.readFileSync(dataFile, "utf8"));
  } catch {
    return [];
  }
}

function writeProducts(products) {
  fs.writeFileSync(dataFile, JSON.stringify(products, null, 2));
}

function generateProductId() {
  return "FP-" + crypto.randomBytes(5).toString("hex").toUpperCase();
}

app.get("/api/health", async (req, res) => {
  let blockchain = false;
  try {
    await provider.getBlockNumber();
    blockchain = true;
  } catch {}

  res.json({
    success: true,
    server: true,
    blockchain,
    contractAddress: CONTRACT_ADDRESS || null
  });
});

app.post("/api/products/register", async (req, res) => {
  try {
    if (!contract) {
      return res.status(500).json({
        success: false,
        message: "Blockchain is not configured. Check backend/.env."
      });
    }

    const {
      name,
      brand,
      manufacturer,
      category,
      batchNumber,
      manufacturingDate,
      expiryDate
    } = req.body;

    if (!name || !brand || !manufacturer || !batchNumber) {
      return res.status(400).json({
        success: false,
        message: "Name, brand, manufacturer and batch number are required."
      });
    }

    const productId = generateProductId();

    const tx = await contract.registerProduct(
      productId,
      name,
      brand,
      manufacturer,
      category || "General",
      batchNumber,
      manufacturingDate || "",
      expiryDate || ""
    );

    const receipt = await tx.wait();

    const record = {
      productId,
      name,
      brand,
      manufacturer,
      category: category || "General",
      batchNumber,
      manufacturingDate: manufacturingDate || "",
      expiryDate: expiryDate || "",
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      createdAt: new Date().toISOString()
    };

    const products = readProducts();
    products.push(record);
    writeProducts(products);

    res.status(201).json({
      success: true,
      message: "Product registered on blockchain.",
      product: record
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.shortMessage || error.message || "Registration failed."
    });
  }
});

app.get("/api/products/verify/:productId", async (req, res) => {
  try {
    if (!contract) {
      return res.status(500).json({
        success: false,
        message: "Blockchain is not configured."
      });
    }

    const productId = req.params.productId.trim();
    const exists = await contract.productExists(productId);

    if (!exists) {
      return res.json({
        success: true,
        authentic: false,
        status: "NOT_FOUND",
        message: "Product was not found on the blockchain."
      });
    }

    const p = await contract.getProduct(productId);

    const product = {
      productId: p.productId,
      name: p.name,
      brand: p.brand,
      manufacturer: p.manufacturer,
      category: p.category,
      batchNumber: p.batchNumber,
      manufacturingDate: p.manufacturingDate,
      expiryDate: p.expiryDate,
      registeredAt: Number(p.registeredAt),
      registeredBy: p.registeredBy,
      active: p.active
    };

    res.json({
      success: true,
      authentic: product.active,
      status: product.active ? "AUTHENTIC" : "REVOKED",
      message: product.active
        ? "This product exists in the blockchain registry."
        : "This product was registered but has been revoked.",
      product
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.shortMessage || error.message || "Verification failed."
    });
  }
});

app.get("/api/products", (req, res) => {
  const products = readProducts();
  res.json({
    success: true,
    products,
    count: products.length
  });
});

app.get("/api/stats", (req, res) => {
  const products = readProducts();
  const brands = new Set(products.map(p => p.brand)).size;
  const manufacturers = new Set(products.map(p => p.manufacturer)).size;

  res.json({
    success: true,
    totalProducts: products.length,
    brands,
    manufacturers,
    verifiedOnChain: products.length
  });
});

app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
});
