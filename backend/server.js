const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
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
   WARNINGS
===================================================== */

if (
  !PRIVATE_KEY ||
  PRIVATE_KEY.includes("PASTE_")
) {
  console.warn(
    "WARNING: backend/.env PRIVATE_KEY is not configured."
  );
}

if (
  !CONTRACT_ADDRESS ||
  CONTRACT_ADDRESS.includes("PASTE_")
) {
  console.warn(
    "WARNING: backend/.env CONTRACT_ADDRESS is not configured."
  );
}

if (
  !process.env.JWT_SECRET ||
  process.env.JWT_SECRET.includes("change_this")
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
  wallet && CONTRACT_ADDRESS
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

    const parsed =
      JSON.parse(data);

    return Array.isArray(parsed)
      ? parsed
      : [];

  } catch (error) {

    console.error(
      "Error reading products.json:",
      error
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
    )
  );
}


function readUsers() {
  try {

    if (!fs.existsSync(usersFile)) {
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

    const parsed =
      JSON.parse(data);

    return Array.isArray(parsed)
      ? parsed
      : [];

  } catch (error) {

    console.error(
      "Error reading users.json:",
      error
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
    )
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
   AUTH MIDDLEWARE
===================================================== */

function authenticateToken(req, res, next) {

  const authHeader =
    req.headers.authorization;

  if (!authHeader) {

    return res.status(401).json({

      success: false,

      message:
        "Login required. Please login to continue."

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
        "Invalid authorization format."

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
        "Your login session has expired. Please login again."

    });

  }

}


/* =====================================================
   HEALTH
   PUBLIC
===================================================== */

app.get(
  "/api/health",
  async (req, res) => {

    let blockchain =
      false;

    try {

      await provider.getBlockNumber();

      blockchain =
        true;

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
        CONTRACT_ADDRESS || null

    });

  }
);


/* =====================================================
   AUTH - REGISTER
   PUBLIC
===================================================== */

app.post(
  "/api/auth/register",
  async (req, res) => {

    try {

      const {
        name,
        email,
        password
      } = req.body;

      if (
        typeof name !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string"
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Name, email and password are required."

        });

      }

      const cleanName =
        name.trim();

      const normalizedEmail =
        email
          .trim()
          .toLowerCase();

      if (
        !cleanName ||
        !normalizedEmail ||
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

      const users =
        readUsers();

      const existingUser =
        users.find(
          user =>
            typeof user.email === "string" &&
            user.email
              .trim()
              .toLowerCase() ===
              normalizedEmail
        );

      if (existingUser) {

        return res.status(409).json({

          success: false,

          message:
            "An account with this email already exists."

        });

      }

      const hashedPassword =
        await bcrypt.hash(
          password,
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
          new Date().toISOString()

      };

      users.push(user);

      writeUsers(users);

      console.log(
        `New user registered: ${normalizedEmail}`
      );

      return res.status(201).json({

        success: true,

        message:
          "Account created successfully."

      });

    } catch (error) {

      console.error(
        "Registration error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Account creation failed."

      });

    }

  }
);


/* =====================================================
   AUTH - LOGIN
   PUBLIC
===================================================== */

app.post(
  "/api/auth/login",
  async (req, res) => {

    try {

      const {
        email,
        password
      } = req.body;

      if (
        typeof email !== "string" ||
        typeof password !== "string"
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

      if (
        !normalizedEmail ||
        !password
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Email and password are required."

        });

      }

      const users =
        readUsers();

      const user =
        users.find(
          item =>
            item &&
            typeof item.email === "string" &&
            item.email
              .trim()
              .toLowerCase() ===
              normalizedEmail
        );

      /*
       * User does not exist.
       */
      if (!user) {

        console.log(
          `Login failed: user not found - ${normalizedEmail}`
        );

        return res.status(401).json({

          success: false,

          message:
            "Invalid email or password."

        });

      }

      /*
       * IMPORTANT FIX:
       *
       * Never call bcrypt.compare() with an undefined
       * password hash.
       */
      let storedPassword =
        user.password;

      if (
        typeof storedPassword !== "string" ||
        !storedPassword.trim()
      ) {

        console.error(
          `Login failed: password hash missing for ${normalizedEmail}`
        );

        return res.status(401).json({

          success: false,

          message:
            "This account has an invalid password record. Please create a new account."

        });

      }

      let passwordMatch =
        false;

      /*
       * Normal bcrypt password.
       */
      if (
        storedPassword.startsWith("$2a$") ||
        storedPassword.startsWith("$2b$") ||
        storedPassword.startsWith("$2y$")
      ) {

        passwordMatch =
          await bcrypt.compare(
            password,
            storedPassword
          );

      } else {

        /*
         * Legacy password support.
         *
         * If an older local users.json contains a
         * plain-text password, allow one successful
         * login and immediately convert it to bcrypt.
         */
        if (
          storedPassword === password
        ) {

          passwordMatch =
            true;

          const newHash =
            await bcrypt.hash(
              password,
              10
            );

          user.password =
            newHash;

          const userIndex =
            users.findIndex(
              item =>
                item.id === user.id
            );

          if (userIndex !== -1) {

            users[userIndex] =
              user;

            writeUsers(users);

            console.log(
              `Migrated legacy password to bcrypt for ${normalizedEmail}`
            );

          }

        } else {

          passwordMatch =
            false;

        }

      }

      if (!passwordMatch) {

        console.log(
          `Login failed: incorrect password - ${normalizedEmail}`
        );

        return res.status(401).json({

          success: false,

          message:
            "Invalid email or password."

        });

      }

      /*
       * Create JWT.
       */
      const token =
        jwt.sign(

          {
            id:
              user.id,

            name:
              user.name,

            email:
              user.email

          },

          JWT_SECRET,

          {
            expiresIn:
              "7d"
          }

        );

      console.log(
        `Login successful: ${normalizedEmail}`
      );

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
            user.email

        }

      });

    } catch (error) {

      console.error(
        "LOGIN ERROR:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Login failed."

      });

    }

  }
);


/* =====================================================
   AUTH - CURRENT USER
   LOGIN REQUIRED
===================================================== */

app.get(
  "/api/auth/me",
  authenticateToken,
  (req, res) => {

    res.json({

      success: true,

      user:
        req.user

    });

  }
);


/* =====================================================
   AUTH - LOGOUT
   LOGIN REQUIRED
===================================================== */

app.post(
  "/api/auth/logout",
  authenticateToken,
  (req, res) => {

    res.json({

      success: true,

      message:
        "Logged out successfully."

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

        registeredBy:
          req.user.email,

        createdAt:
          new Date().toISOString()

      };

      const products =
        readProducts();

      products.push(record);

      writeProducts(products);

      console.log(
        `Product registered successfully: ${productId}`
      );

      return res.status(201).json({

        success: true,

        message:
          "Product registered on blockchain.",

        product:
          record

      });

    } catch (error) {

      console.error(
        "PRODUCT REGISTRATION ERROR:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          error.shortMessage ||
          error.message ||
          "Registration failed."

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
            "Blockchain is not configured."

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
            "Product ID is required."

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
          Number(
            p.registeredAt
          ),

        registeredBy:
          p.registeredBy,

        active:
          p.active

      };

      return res.json({

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

      console.error(
        "PRODUCT VERIFICATION ERROR:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          error.shortMessage ||
          error.message ||
          "Verification failed."

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

      return res.json({

        success: true,

        products,

        count:
          products.length

      });

    } catch (error) {

      console.error(
        "PRODUCT REGISTRY ERROR:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to load product registry."

      });

    }

  }
);


/* =====================================================
   STATS
   PUBLIC
===================================================== */

app.get(
  "/api/stats",
  (req, res) => {

    try {

      const products =
        readProducts();

      const brands =
        new Set(
          products
            .map(
              p => p.brand
            )
            .filter(Boolean)
        ).size;

      const manufacturers =
        new Set(
          products
            .map(
              p => p.manufacturer
            )
            .filter(Boolean)
        ).size;

      return res.json({

        success: true,

        totalProducts:
          products.length,

        brands,

        manufacturers,

        verifiedOnChain:
          products.length

      });

    } catch (error) {

      console.error(
        "STATS ERROR:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to load statistics."

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
        "API endpoint not found."

    });

  }
);


/* =====================================================
   GLOBAL ERROR HANDLER
===================================================== */

app.use(
  (error, req, res, next) => {

    console.error(
      "GLOBAL SERVER ERROR:",
      error
    );

    res.status(500).json({

      success: false,

      message:
        "Internal server error."

    });

  }
);


/* =====================================================
   SERVER
===================================================== */

app.listen(
  PORT,
  () => {

    console.log(
      `API running on port ${PORT}`
    );

    console.log(
      `Blockchain RPC: ${RPC_URL}`
    );

    console.log(
      `Contract: ${CONTRACT_ADDRESS || "Not configured"}`
    );

  }
);