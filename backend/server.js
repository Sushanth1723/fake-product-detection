const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { ethers } = require("ethers");

require("dotenv").config({
  path: path.join(__dirname, ".env"),
});

const app = express();

/* =====================================================
   BASIC CONFIG
===================================================== */

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

const PORT = process.env.PORT || 5000;

const RPC_URL =
  process.env.RPC_URL ||
  "http://127.0.0.1:8545";

const PRIVATE_KEY =
  process.env.PRIVATE_KEY;

const CONTRACT_ADDRESS =
  process.env.CONTRACT_ADDRESS;

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "blockverify_dev_secret_change_this";

const ABI =
  require("./contract.json").abi;

const dataFile =
  path.join(__dirname, "products.json");

const usersFile =
  path.join(__dirname, "users.json");


/* =====================================================
   CONFIG WARNINGS
===================================================== */

if (
  !PRIVATE_KEY ||
  PRIVATE_KEY.includes("PASTE_")
) {
  console.warn(
    "WARNING: PRIVATE_KEY is not configured."
  );
}

if (
  !CONTRACT_ADDRESS ||
  CONTRACT_ADDRESS.includes("PASTE_")
) {
  console.warn(
    "WARNING: CONTRACT_ADDRESS is not configured."
  );
}

if (
  !process.env.JWT_SECRET ||
  process.env.JWT_SECRET.includes("dev_secret")
) {
  console.warn(
    "WARNING: JWT_SECRET is using the development fallback."
  );
}


/* =====================================================
   BLOCKCHAIN
===================================================== */

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
  wallet &&
  CONTRACT_ADDRESS &&
  !CONTRACT_ADDRESS.includes("PASTE_")
    ? new ethers.Contract(
        CONTRACT_ADDRESS,
        ABI,
        wallet
      )
    : null;


/* =====================================================
   FILE HELPERS
===================================================== */

function readProducts() {
  try {
    if (!fs.existsSync(dataFile)) {
      fs.writeFileSync(
        dataFile,
        "[]",
        "utf8"
      );
      return [];
    }

    const data =
      fs.readFileSync(
        dataFile,
        "utf8"
      );

    if (!data.trim()) {
      return [];
    }

    return JSON.parse(data);

  } catch (error) {

    console.error(
      "Error reading products.json:",
      error.message
    );

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
    ),
    "utf8"
  );

}


function readUsers() {

  try {

    if (!fs.existsSync(usersFile)) {

      fs.writeFileSync(
        usersFile,
        "[]",
        "utf8"
      );

      return [];
    }

    const data =
      fs.readFileSync(
        usersFile,
        "utf8"
      );

    if (!data.trim()) {
      return [];
    }

    const users =
      JSON.parse(data);

    return Array.isArray(users)
      ? users
      : [];

  } catch (error) {

    console.error(
      "Error reading users.json:",
      error.message
    );

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
    ),
    "utf8"
  );

}


function generateProductId() {

  return (
    "FP-" +
    crypto
      .randomBytes(5)
      .toString("hex")
      .toUpperCase()
  );

}


/* =====================================================
   JWT AUTH MIDDLEWARE
===================================================== */

function authenticateToken(
  req,
  res,
  next
) {

  const authHeader =
    req.headers.authorization;

  if (!authHeader) {

    return res.status(401).json({
      success: false,
      message:
        "Login required. Please login to continue.",
    });

  }

  const parts =
    authHeader.split(" ");

  if (
    parts.length !== 2 ||
    parts[0] !== "Bearer" ||
    !parts[1]
  ) {

    return res.status(401).json({
      success: false,
      message:
        "Invalid authorization format.",
    });

  }

  const token =
    parts[1];

  try {

    const decoded =
      jwt.verify(
        token,
        JWT_SECRET
      );

    req.user =
      decoded;

    next();

  } catch (error) {

    console.error(
      "JWT verification failed:",
      error.message
    );

    return res.status(401).json({
      success: false,
      message:
        "Your login session has expired. Please login again.",
    });

  }

}


/* =====================================================
   HEALTH
===================================================== */

app.get(
  "/api/health",
  async (req, res) => {

    let blockchain = false;

    try {

      await provider.getBlockNumber();

      blockchain = true;

    } catch (error) {

      console.error(
        "Blockchain health check failed:",
        error.message
      );

    }

    res.json({

      success: true,

      server: true,

      blockchain,

      contractAddress:
        CONTRACT_ADDRESS || null,

    });

  }
);


/* =====================================================
   AUTH - REGISTER
===================================================== */

app.post(
  "/api/auth/register",
  async (req, res) => {

    try {

      const {
        name,
        email,
        password,
      } = req.body;

      if (
        !name ||
        !email ||
        !password
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Name, email and password are required.",
        });

      }

      const cleanName =
        String(name).trim();

      const normalizedEmail =
        String(email)
          .trim()
          .toLowerCase();

      const cleanPassword =
        String(password);

      if (
        !cleanName ||
        !normalizedEmail ||
        !cleanPassword
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Please provide valid account details.",
        });

      }

      if (
        cleanPassword.length < 6
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Password must be at least 6 characters.",
        });

      }

      const users =
        readUsers();

      const existingUser =
        users.find(
          (user) =>
            String(
              user.email || ""
            )
              .trim()
              .toLowerCase() ===
            normalizedEmail
        );

      if (existingUser) {

        return res.status(409).json({
          success: false,
          message:
            "An account with this email already exists.",
        });

      }

      /* -----------------------------------------------
         HASH PASSWORD
      ------------------------------------------------ */

      const hashedPassword =
        await bcrypt.hash(
          cleanPassword,
          10
        );

      const user = {

        id:
          crypto.randomUUID(),

        name:
          cleanName,

        email:
          normalizedEmail,

        password:
          hashedPassword,

        createdAt:
          new Date().toISOString(),

      };

      users.push(user);

      writeUsers(users);

      console.log(
        `New user registered: ${normalizedEmail}`
      );

      return res.status(201).json({

        success: true,

        message:
          "Account created successfully.",

      });

    } catch (error) {

      console.error(
        "REGISTER ERROR:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Account creation failed.",

      });

    }

  }
);


/* =====================================================
   AUTH - LOGIN
===================================================== */

app.post(
  "/api/auth/login",
  async (req, res) => {

    try {

      const {
        email,
        password,
      } = req.body;

      /* -----------------------------------------------
         VALIDATE INPUT
      ------------------------------------------------ */

      if (
        !email ||
        !password
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Email and password are required.",

        });

      }

      const normalizedEmail =
        String(email)
          .trim()
          .toLowerCase();

      const enteredPassword =
        String(password);

      /* -----------------------------------------------
         LOAD USERS
      ------------------------------------------------ */

      const users =
        readUsers();

      const userIndex =
        users.findIndex(
          (item) =>
            String(
              item.email || ""
            )
              .trim()
              .toLowerCase() ===
            normalizedEmail
        );

      if (userIndex === -1) {

        console.log(
          `Login failed - user not found: ${normalizedEmail}`
        );

        return res.status(401).json({

          success: false,

          message:
            "Invalid email or password.",

        });

      }

      const user =
        users[userIndex];

      /* -----------------------------------------------
         IMPORTANT PASSWORD SAFETY CHECK
      ------------------------------------------------ */

      const storedPassword =
        user.password ||
        user.passwordHash ||
        null;

      if (
        !storedPassword ||
        typeof storedPassword !== "string"
      ) {

        console.error(
          `User ${normalizedEmail} has no valid password hash.`
        );

        return res.status(401).json({

          success: false,

          message:
            "This account needs to be recreated. Please create a new account.",

        });

      }

      /* -----------------------------------------------
         CHECK PASSWORD
      ------------------------------------------------ */

      let passwordMatch = false;

      /*
         Normal case:
         password is a bcrypt hash.
      */

      if (
        storedPassword.startsWith("$2a$") ||
        storedPassword.startsWith("$2b$") ||
        storedPassword.startsWith("$2y$")
      ) {

        passwordMatch =
          await bcrypt.compare(
            enteredPassword,
            storedPassword
          );

      } else {

        /*
           LEGACY SUPPORT

           If an older version of the application
           stored the password as plain text,
           temporarily support it and immediately
           convert it into a bcrypt hash.
        */

        passwordMatch =
          storedPassword ===
          enteredPassword;

        if (passwordMatch) {

          const newHash =
            await bcrypt.hash(
              enteredPassword,
              10
            );

          users[userIndex].password =
            newHash;

          delete users[userIndex].passwordHash;

          writeUsers(users);

          console.log(
            `Migrated legacy password for ${normalizedEmail}`
          );

        }

      }

      if (!passwordMatch) {

        console.log(
          `Login failed - incorrect password: ${normalizedEmail}`
        );

        return res.status(401).json({

          success: false,

          message:
            "Invalid email or password.",

        });

      }

      /* -----------------------------------------------
         CREATE JWT
      ------------------------------------------------ */

      const token =
        jwt.sign(

          {
            id:
              user.id,

            name:
              user.name,

            email:
              user.email,

          },

          JWT_SECRET,

          {
            expiresIn:
              "7d",
          }

        );

      console.log(
        `Login successful: ${normalizedEmail}`
      );

      /* -----------------------------------------------
         RESPONSE
      ------------------------------------------------ */

      return res.json({

        success: true,

        message:
          "Login successful.",

        token,

        user: {

          id:
            user.id,

          name:
            user.name,

          email:
            user.email,

        },

      });

    } catch (error) {

      console.error(
        "LOGIN ERROR:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Login failed.",

      });

    }

  }
);


/* =====================================================
   AUTH - CURRENT USER
===================================================== */

app.get(
  "/api/auth/me",
  authenticateToken,
  (req, res) => {

    res.json({

      success: true,

      user:
        req.user,

    });

  }
);


/* =====================================================
   AUTH - LOGOUT
===================================================== */

app.post(
  "/api/auth/logout",
  authenticateToken,
  (req, res) => {

    res.json({

      success: true,

      message:
        "Logged out successfully.",

    });

  }
);


/* =====================================================
   REGISTER PRODUCT
   LOGIN REQUIRED
===================================================== */

app.post(
  "/api/products/register",
  authenticateToken,
  async (req, res) => {

    try {

      if (!contract) {

        return res.status(500).json({

          success: false,

          message:
            "Blockchain is not configured. Check backend environment variables.",

        });

      }

      const {
        name,
        brand,
        manufacturer,
        category,
        batchNumber,
        manufacturingDate,
        expiryDate,
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
            "Name, brand, manufacturer and batch number are required.",

        });

      }

      const productId =
        generateProductId();

      console.log(
        `Registering product ${productId} by ${req.user.email}`
      );

      const tx =
        await contract.registerProduct(

          productId,

          name,

          brand,

          manufacturer,

          category ||
            "General",

          batchNumber,

          manufacturingDate ||
            "",

          expiryDate ||
            ""

        );

      const receipt =
        await tx.wait();

      const record = {

        productId,

        name,

        brand,

        manufacturer,

        category:
          category ||
          "General",

        batchNumber,

        manufacturingDate:
          manufacturingDate ||
          "",

        expiryDate:
          expiryDate ||
          "",

        transactionHash:
          receipt.hash,

        blockNumber:
          receipt.blockNumber,

        registeredBy:
          req.user.email,

        createdAt:
          new Date().toISOString(),

      };

      const products =
        readProducts();

      products.push(record);

      writeProducts(products);

      console.log(
        `Product registered successfully: ${productId}`
      );

      res.status(201).json({

        success: true,

        message:
          "Product registered on blockchain.",

        product:
          record,

      });

    } catch (error) {

      console.error(
        "PRODUCT REGISTRATION ERROR:",
        error
      );

      res.status(500).json({

        success: false,

        message:
          error.shortMessage ||
          error.message ||
          "Registration failed.",

      });

    }

  }
);


/* =====================================================
   VERIFY PRODUCT
   PUBLIC
===================================================== */

app.get(
  "/api/products/verify/:productId",
  async (req, res) => {

    try {

      if (!contract) {

        return res.status(500).json({

          success: false,

          message:
            "Blockchain is not configured.",

        });

      }

      const productId =
        String(
          req.params.productId || ""
        ).trim();

      if (!productId) {

        return res.status(400).json({

          success: false,

          message:
            "Product ID is required.",

        });

      }

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
            "Product was not found on the blockchain.",

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
          Number(
            p.registeredAt
          ),

        registeredBy:
          p.registeredBy,

        active:
          p.active,

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

        product,

      });

    } catch (error) {

      console.error(
        "VERIFY ERROR:",
        error
      );

      res.status(500).json({

        success: false,

        message:
          error.shortMessage ||
          error.message ||
          "Verification failed.",

      });

    }

  }
);


/* =====================================================
   PRODUCT REGISTRY
   LOGIN REQUIRED
===================================================== */

app.get(
  "/api/products",
  authenticateToken,
  (req, res) => {

    try {

      const products =
        readProducts();

      res.json({

        success: true,

        products,

        count:
          products.length,

      });

    } catch (error) {

      console.error(
        "PRODUCTS ERROR:",
        error
      );

      res.status(500).json({

        success: false,

        message:
          "Unable to load product registry.",

      });

    }

  }
);


/* =====================================================
   STATS
   LOGIN REQUIRED
===================================================== */

app.get(
  "/api/stats",
  authenticateToken,
  (req, res) => {

    try {

      const products =
        readProducts();

      const brands =
        new Set(
          products
            .map(
              (p) => p.brand
            )
            .filter(Boolean)
        ).size;

      const manufacturers =
        new Set(
          products
            .map(
              (p) => p.manufacturer
            )
            .filter(Boolean)
        ).size;

      res.json({

        success: true,

        totalProducts:
          products.length,

        brands,

        manufacturers,

        verifiedOnChain:
          products.length,

      });

    } catch (error) {

      console.error(
        "STATS ERROR:",
        error
      );

      res.status(500).json({

        success: false,

        message:
          "Unable to load statistics.",

      });

    }

  }
);


/* =====================================================
   404 HANDLER
===================================================== */

app.use(
  (req, res) => {

    res.status(404).json({

      success: false,

      message:
        "API endpoint not found.",

    });

  }
);


/* =====================================================
   SERVER
===================================================== */

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      "=============================================="
    );

    console.log(
      `API running on port ${PORT}`
    );

    console.log(
      `Blockchain RPC: ${RPC_URL}`
    );

    console.log(
      `Contract: ${CONTRACT_ADDRESS || "Not configured"}`
    );

    console.log(
      "=============================================="
    );

  }
);