const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { ethers } = require("ethers");

require("dotenv").config({
  path: path.join(__dirname, ".env")
});

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

const RPC_URL =
  process.env.RPC_URL ||
  "http://127.0.0.1:8545";

const PRIVATE_KEY = process.env.PRIVATE_KEY;

const CONTRACT_ADDRESS =
  process.env.CONTRACT_ADDRESS;

const ABI =
  require("./contract.json").abi;

const dataFile =
  path.join(__dirname, "products.json");

const usersFile =
  path.join(__dirname, "users.json");


/* =================================
   BLOCKCHAIN
================================= */

const provider =
  new ethers.JsonRpcProvider(RPC_URL);

const wallet =
  PRIVATE_KEY &&
  !PRIVATE_KEY.includes("PASTE_")
    ? new ethers.Wallet(
        PRIVATE_KEY,
        provider
      )
    : null;

const contract =
  wallet && CONTRACT_ADDRESS
    ? new ethers.Contract(
        CONTRACT_ADDRESS,
        ABI,
        wallet
      )
    : null;


/* =================================
   FILE HELPERS
================================= */

function readProducts() {

  try {

    return JSON.parse(
      fs.readFileSync(
        dataFile,
        "utf8"
      )
    );

  } catch {

    return [];

  }
}


function writeProducts(products) {

  fs.writeFileSync(
    dataFile,
    JSON.stringify(
      products,
      null,
      2
    )
  );

}


function readUsers() {

  try {

    if (!fs.existsSync(usersFile)) {
      fs.writeFileSync(
        usersFile,
        "[]"
      );
    }

    return JSON.parse(
      fs.readFileSync(
        usersFile,
        "utf8"
      )
    );

  } catch {

    return [];

  }
}


function writeUsers(users) {

  fs.writeFileSync(
    usersFile,
    JSON.stringify(
      users,
      null,
      2
    )
  );

}


/* =================================
   PRODUCT ID
================================= */

function generateProductId() {

  return (
    "FP-" +
    crypto
      .randomBytes(5)
      .toString("hex")
      .toUpperCase()
  );

}


/* =================================
   PASSWORD HASHING
================================= */

function hashPassword(password) {

  const salt =
    crypto
      .randomBytes(16)
      .toString("hex");

  const hash =
    crypto
      .scryptSync(
        password,
        salt,
        64
      )
      .toString("hex");

  return {
    salt,
    hash
  };

}


function verifyPassword(
  password,
  salt,
  storedHash
) {

  const hash =
    crypto
      .scryptSync(
        password,
        salt,
        64
      )
      .toString("hex");

  return crypto.timingSafeEqual(
    Buffer.from(hash, "hex"),
    Buffer.from(storedHash, "hex")
  );

}


/* =================================
   TOKEN HELPERS
================================= */

function generateToken() {

  return crypto
    .randomBytes(32)
    .toString("hex");

}


/*
  Demo session storage.

  This is intentionally simple for
  the college project.
*/

const sessions = new Map();


function getUserFromToken(req) {

  const auth =
    req.headers.authorization;

  if (!auth) {
    return null;
  }

  const parts =
    auth.split(" ");

  if (
    parts.length !== 2 ||
    parts[0] !== "Bearer"
  ) {
    return null;
  }

  const token = parts[1];

  const user =
    sessions.get(token);

  return user || null;

}


/* =================================
   AUTH REGISTER
================================= */

app.post(
  "/api/auth/register",
  (req, res) => {

    try {

      const {
        name,
        email,
        password
      } = req.body;


      if (
        !name ||
        !email ||
        !password
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Name, email and password are required."

        });

      }


      if (password.length < 6) {

        return res.status(400).json({

          success: false,

          message:
            "Password must be at least 6 characters."

        });

      }


      const normalizedEmail =
        email
          .trim()
          .toLowerCase();


      const users =
        readUsers();


      const existingUser =
        users.find(
          user =>
            user.email ===
            normalizedEmail
        );


      if (existingUser) {

        return res.status(409).json({

          success: false,

          message:
            "An account with this email already exists."

        });

      }


      const {
        salt,
        hash
      } = hashPassword(password);


      const user = {

        id:
          crypto
            .randomUUID(),

        name:
          name.trim(),

        email:
          normalizedEmail,

        salt,

        passwordHash:
          hash,

        createdAt:
          new Date().toISOString()

      };


      users.push(user);

      writeUsers(users);


      res.status(201).json({

        success: true,

        message:
          "Account created successfully.",

        user: {

          id: user.id,

          name: user.name,

          email: user.email

        }

      });

    } catch (error) {

      console.error(error);

      res.status(500).json({

        success: false,

        message:
          "Registration failed."

      });

    }

  }
);


/* =================================
   AUTH LOGIN
================================= */

app.post(
  "/api/auth/login",
  (req, res) => {

    try {

      const {
        email,
        password
      } = req.body;


      if (
        !email ||
        !password
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Email and password are required."

        });

      }


      const normalizedEmail =
        email
          .trim()
          .toLowerCase();


      const users =
        readUsers();


      const user =
        users.find(
          item =>
            item.email ===
            normalizedEmail
        );


      if (!user) {

        return res.status(401).json({

          success: false,

          message:
            "Invalid email or password."

        });

      }


      const valid =
        verifyPassword(
          password,
          user.salt,
          user.passwordHash
        );


      if (!valid) {

        return res.status(401).json({

          success: false,

          message:
            "Invalid email or password."

        });

      }


      const token =
        generateToken();


      sessions.set(
        token,
        {
          id: user.id,
          name: user.name,
          email: user.email
        }
      );


      res.json({

        success: true,

        message:
          "Login successful.",

        token,

        user: {

          id: user.id,

          name: user.name,

          email: user.email

        }

      });

    } catch (error) {

      console.error(error);

      res.status(500).json({

        success: false,

        message:
          "Login failed."

      });

    }

  }
);


/* =================================
   CURRENT USER
================================= */

app.get(
  "/api/auth/me",
  (req, res) => {

    const user =
      getUserFromToken(req);


    if (!user) {

      return res.status(401).json({

        success: false,

        message:
          "Not logged in."

      });

    }


    res.json({

      success: true,

      user

    });

  }
);


/* =================================
   LOGOUT
================================= */

app.post(
  "/api/auth/logout",
  (req, res) => {

    const auth =
      req.headers.authorization;


    if (auth) {

      const parts =
        auth.split(" ");


      if (
        parts.length === 2
      ) {

        sessions.delete(
          parts[1]
        );

      }

    }


    res.json({

      success: true,

      message:
        "Logged out successfully."

    });

  }
);


/* =================================
   HEALTH
================================= */

app.get(
  "/api/health",
  async (req, res) => {

    let blockchain = false;

    try {

      await provider.getBlockNumber();

      blockchain = true;

    } catch {}


    res.json({

      success: true,

      server: true,

      blockchain,

      contractAddress:
        CONTRACT_ADDRESS || null

    });

  }
);


/* =================================
   REGISTER PRODUCT
================================= */

app.post(
  "/api/products/register",
  async (req, res) => {

    try {

      if (!contract) {

        return res.status(500).json({

          success: false,

          message:
            "Blockchain is not configured. Check backend/.env."

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


      if (
        !name ||
        !brand ||
        !manufacturer ||
        !batchNumber
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Name, brand, manufacturer and batch number are required."

        });

      }


      const productId =
        generateProductId();


      const tx =
        await contract.registerProduct(

          productId,

          name,

          brand,

          manufacturer,

          category || "General",

          batchNumber,

          manufacturingDate || "",

          expiryDate || ""

        );


      const receipt =
        await tx.wait();


      const record = {

        productId,

        name,

        brand,

        manufacturer,

        category:
          category || "General",

        batchNumber,

        manufacturingDate:
          manufacturingDate || "",

        expiryDate:
          expiryDate || "",

        transactionHash:
          receipt.hash,

        blockNumber:
          receipt.blockNumber,

        createdAt:
          new Date().toISOString()

      };


      const products =
        readProducts();


      products.push(record);


      writeProducts(products);


      res.status(201).json({

        success: true,

        message:
          "Product registered on blockchain.",

        product: record

      });

    } catch (error) {

      console.error(error);

      res.status(500).json({

        success: false,

        message:
          error.shortMessage ||
          error.message ||
          "Registration failed."

      });

    }

  }
);


/* =================================
   VERIFY PRODUCT
================================= */

app.get(
  "/api/products/verify/:productId",
  async (req, res) => {

    try {

      if (!contract) {

        return res.status(500).json({

          success: false,

          message:
            "Blockchain is not configured."

        });

      }


      const productId =
        req.params.productId.trim();


      const exists =
        await contract.productExists(
          productId
        );


      if (!exists) {

        return res.json({

          success: true,

          authentic: false,

          status:
            "NOT_FOUND",

          message:
            "Product was not found on the blockchain."

        });

      }


      const p =
        await contract.getProduct(
          productId
        );


      const product = {

        productId:
          p.productId,

        name:
          p.name,

        brand:
          p.brand,

        manufacturer:
          p.manufacturer,

        category:
          p.category,

        batchNumber:
          p.batchNumber,

        manufacturingDate:
          p.manufacturingDate,

        expiryDate:
          p.expiryDate,

        registeredAt:
          Number(p.registeredAt),

        registeredBy:
          p.registeredBy,

        active:
          p.active

      };


      res.json({

        success: true,

        authentic:
          product.active,

        status:
          product.active
            ? "AUTHENTIC"
            : "REVOKED",

        message:
          product.active

            ? "This product exists in the blockchain registry."

            : "This product was registered but has been revoked.",

        product

      });

    } catch (error) {

      console.error(error);

      res.status(500).json({

        success: false,

        message:
          error.shortMessage ||
          error.message ||
          "Verification failed."

      });

    }

  }
);


/* =================================
   PRODUCTS
================================= */

app.get(
  "/api/products",
  (req, res) => {

    const products =
      readProducts();


    res.json({

      success: true,

      products,

      count:
        products.length

    });

  }
);


/* =================================
   STATS
================================= */

app.get(
  "/api/stats",
  (req, res) => {

    const products =
      readProducts();


    const brands =
      new Set(
        products.map(
          p => p.brand
        )
      ).size;


    const manufacturers =
      new Set(
        products.map(
          p => p.manufacturer
        )
      ).size;


    res.json({

      success: true,

      totalProducts:
        products.length,

      brands,

      manufacturers,

      verifiedOnChain:
        products.length

    });

  }
);


/* =================================
   START SERVER
================================= */

app.listen(
  PORT,
  () => {

    console.log(
      `API running at http://localhost:${PORT}`
    );

  }
);