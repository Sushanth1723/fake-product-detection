import React, { useEffect, useState } from "react";

import {
  Link,
  Route,
  Routes,
  useLocation,
  useSearchParams,
  Navigate
} from "react-router-dom";

import {
  ShieldCheck,
  Search,
  PackageCheck,
  User,
  LogIn,
  LogOut,
  Database,
  PlusCircle,
  LayoutDashboard,
  Blocks,
  Menu,
  X,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

import { Html5QrcodeScanner } from "html5-qrcode";
import { QRCodeCanvas } from "qrcode.react";

import { api } from "./api";


/* =========================================================
   LAYOUT
========================================================= */

function Layout({ children }) {

  const location = useLocation();

  const [open, setOpen] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("blockverify-theme") === "dark";
  });

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("blockverify_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });


  useEffect(() => {

    document.body.classList.toggle(
      "dark-mode",
      darkMode
    );

    localStorage.setItem(
      "blockverify-theme",
      darkMode ? "dark" : "light"
    );

  }, [darkMode]);


  function logout() {

    localStorage.removeItem("blockverify_token");
    localStorage.removeItem("blockverify_user");

    setUser(null);
    setOpen(false);

    window.location.href = "/";
  }


  const links = [
    ["/", "Dashboard", LayoutDashboard],
    ["/verify", "Verify Product", Search],
    ["/register", "Register Product", PlusCircle],
    ["/products", "Product Registry", Database]
  ];


  return (

    <div className="app-shell">

      <header className="topbar">

        <Link
          className="brand"
          to="/"
          onClick={() => setOpen(false)}
        >

          <span className="brand-icon">
            <ShieldCheck size={23} />
          </span>

          <span>
            Block<span>Verify</span>
          </span>

        </Link>


        <button
          className="menu-btn"
          type="button"
          onClick={() => setOpen(!open)}
        >

          {open ? <X /> : <Menu />}

        </button>


        <nav className={open ? "nav open" : "nav"}>

          <button
            className="theme-toggle"
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            title={
              darkMode
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
          >

            {darkMode ? "☀️" : "🌙"}

          </button>


          {links.map(([to, label, Icon]) => (

            <Link
              key={to}
              className={
                location.pathname === to
                  ? "active"
                  : ""
              }
              to={to}
              onClick={() => setOpen(false)}
            >

              <Icon size={17} />

              {label}

            </Link>

          ))}


          {user ? (

            <>

              <span className="user-name">

                <User size={17} />

                {user.name}

              </span>


              <button
                className="logout-btn"
                type="button"
                onClick={logout}
              >

                <LogOut size={17} />

                Logout

              </button>

            </>

          ) : (

            <Link
              className={
                location.pathname === "/auth"
                  ? "active"
                  : ""
              }
              to="/auth"
              onClick={() => setOpen(false)}
            >

              <LogIn size={17} />

              Login

            </Link>

          )}

        </nav>

      </header>


      <main>

        {children}

      </main>


      <footer>

        <span>BlockVerify</span>

        {" · "}

        Blockchain-based product authenticity demo

      </footer>

    </div>

  );
}



/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard() {

  const [stats, setStats] = useState(null);

  const [health, setHealth] = useState(null);


  useEffect(() => {

    Promise.all([
      api.stats(),
      api.health()
    ])
      .then(([statsData, healthData]) => {

        setStats(statsData);

        setHealth(healthData);

      })
      .catch(console.error);

  }, []);


  return (

    <section className="container">

      <div className="hero">

        <div>

          <div className="eyebrow">

            <Blocks size={16} />

            BLOCKCHAIN AUTHENTICITY

          </div>


          <h1>

            Detect fake products

            <br />

            with <span>blockchain.</span>

          </h1>


          <p>

            Register genuine products on an immutable
            blockchain ledger and verify them instantly
            using a unique product code.

          </p>


          <div className="hero-actions">

            <Link
              className="btn primary"
              to="/verify"
            >

              <Search size={18} />

              Verify a Product

            </Link>


            <Link
              className="btn secondary"
              to="/register"
            >

              <PlusCircle size={18} />

              Register Product

            </Link>

          </div>

        </div>


        <div className="hero-card">

          <div className="chain-orb">

            <ShieldCheck size={54} />

          </div>


          <h3>

            Trust layer

          </h3>


          <p>

            Product identity is recorded on-chain so
            the verification record cannot be silently changed.

          </p>


          <div className="chain-status">

            <span
              className={
                health?.blockchain
                  ? "dot online"
                  : "dot"
              }
            />

            {health?.blockchain
              ? "Local blockchain connected"
              : "Checking blockchain..."}

          </div>

        </div>

      </div>


      <div className="stats-grid">

        <Stat
          icon={<PackageCheck />}
          label="Registered Products"
          value={stats?.totalProducts ?? "—"}
        />


        <Stat
          icon={<Database />}
          label="Brands"
          value={stats?.brands ?? "—"}
        />


        <Stat
          icon={<ShieldCheck />}
          label="On-chain Records"
          value={stats?.verifiedOnChain ?? "—"}
        />

      </div>


      <div className="info-grid">

        <div className="panel">

          <h2>

            How it works

          </h2>


          <div className="steps">

            <Step
              n="01"
              title="Manufacturer registers"
              text="Product identity and batch details are sent to the smart contract."
            />


            <Step
              n="02"
              title="Blockchain creates proof"
              text="The network stores the registration and transaction hash."
            />


            <Step
              n="03"
              title="Customer verifies"
              text="Enter the product ID or scan the QR code to compare it against the blockchain registry."
            />

          </div>

        </div>


        <div className="panel accent-panel">

          <h2>

            Why blockchain?

          </h2>


          <ul className="clean-list">

            <li>
              <CheckCircle2 />
              Tamper-evident registration
            </li>

            <li>
              <CheckCircle2 />
              Transparent verification
            </li>

            <li>
              <CheckCircle2 />
              Traceable product history
            </li>

            <li>
              <CheckCircle2 />
              No single editable verification record
            </li>

          </ul>

        </div>

      </div>

    </section>

  );
}



/* =========================================================
   STAT
========================================================= */

function Stat({ icon, label, value }) {

  return (

    <div className="stat-card">

      <div className="stat-icon">

        {icon}

      </div>


      <div>

        <strong>

          {value}

        </strong>

        <span>

          {label}

        </span>

      </div>

    </div>

  );
}



/* =========================================================
   STEP
========================================================= */

function Step({ n, title, text }) {

  return (

    <div className="step">

      <b>

        {n}

      </b>


      <div>

        <h3>

          {title}

        </h3>

        <p>

          {text}

        </p>

      </div>

    </div>

  );
}



/* =========================================================
   VERIFY PRODUCT
========================================================= */

function Verify() {

  const [searchParams] = useSearchParams();


  const [id, setId] = useState(
    searchParams.get("product") || ""
  );


  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(false);

  const [scanning, setScanning] = useState(false);


  async function verifyProduct(productId) {

    const cleanId =
      String(productId || "").trim();


    if (!cleanId) {

      setResult({

        success: false,

        status: "ERROR",

        message: "Please enter a product ID."

      });

      return;

    }


    setLoading(true);

    setResult(null);


    try {

      const data =
        await api.verify(cleanId);

      setResult(data);

    } catch (error) {

      setResult({

        success: false,

        status: "ERROR",

        message:
          error.message ||
          "Verification failed."

      });

    } finally {

      setLoading(false);

    }

  }


  async function submit(event) {

    event.preventDefault();

    await verifyProduct(id);

  }


  useEffect(() => {

    if (!scanning) {
      return;
    }


    let scanner = null;

    let active = true;


    async function startScanner() {

      try {

        scanner =
          new Html5QrcodeScanner(
            "qr-reader",
            {
              fps: 10,

              qrbox: {
                width: 250,
                height: 250
              }
            },
            false
          );


        scanner.render(

          async (decodedText) => {

            if (!active) {
              return;
            }


            const decoded =
              String(decodedText).trim();


            console.log(
              "QR Code detected:",
              decoded
            );


            setId(decoded);

            setScanning(false);


            try {

              await scanner.clear();

            } catch (error) {

              console.log(
                "Scanner cleanup:",
                error
              );

            }


            await verifyProduct(decoded);

          },


          () => {
            // Ignore normal scanner messages.
          }

        );

      } catch (error) {

        console.error(
          "QR scanner error:",
          error
        );


        if (active) {

          setScanning(false);


          setResult({

            success: false,

            status: "ERROR",

            message:
              "Unable to start camera scanner. Please allow camera access and try again."

          });

        }

      }

    }


    startScanner();


    return () => {

      active = false;


      if (scanner) {

        scanner
          .clear()
          .catch(() => {});

      }

    };

  }, [scanning]);


  const authentic =
    result?.status === "AUTHENTIC";


  return (

    <section className="container narrow">

      <div className="page-heading">

        <div className="eyebrow">

          <Search size={16} />

          PRODUCT VERIFICATION

        </div>


        <h1>

          Is your product genuine?

        </h1>


        <p>

          Enter the unique product ID printed
          on the package or scan the QR code.

        </p>

      </div>


      <form
        className="verify-box"
        onSubmit={submit}
      >

        <label>

          Product ID

        </label>


        <div className="input-row">

          <input
            value={id}
            onChange={(event) =>
              setId(event.target.value)
            }
            placeholder="Example: FP-A1B2C3D4E5"
          />


          <button
            className="btn primary"
            type="submit"
            disabled={loading}
          >

            {loading
              ? "Checking..."
              : "Verify"}

          </button>

        </div>

      </form>


      <div className="qr-section">

        {!scanning ? (

          <button
            className="btn secondary qr-button"
            type="button"
            onClick={() => setScanning(true)}
          >

            📷 Scan QR Code

          </button>

        ) : (

          <div className="qr-scanner-box">

            <h3>

              Scan Product QR Code

            </h3>


            <p>

              Allow camera access and place
              the QR code inside the scanning box.

            </p>


            <div id="qr-reader"></div>


            <button
              className="btn secondary"
              type="button"
              onClick={() => setScanning(false)}
            >

              Stop Scanner

            </button>

          </div>

        )}

      </div>


      {result && (

        <div
          className={`result-card ${
            authentic
              ? "success"
              : "danger"
          }`}
        >

          <div className="result-top">

            {authentic ? (
              <CheckCircle2 size={48} />
            ) : (
              <AlertTriangle size={48} />
            )}


            <div>

              <div className="result-status">

                {result.status || "RESULT"}

              </div>


              <p>

                {result.message}

              </p>

            </div>

          </div>


          {result.product && (

            <ProductDetails
              product={result.product}
            />

          )}

        </div>

      )}


      <div className="tip">

        <ShieldCheck size={22} />


        <div>

          <b>

            Verification tip

          </b>


          <p>

            A genuine product must have a
            matching record in the blockchain
            registry. A product code alone is
            not proof unless the blockchain
            record matches.

          </p>

        </div>

      </div>

    </section>

  );
}



/* =========================================================
   PRODUCT DETAILS
========================================================= */

function ProductDetails({ product }) {

  const rows = [

    ["Product", product.name],

    ["Brand", product.brand],

    ["Manufacturer", product.manufacturer],

    ["Category", product.category],

    ["Batch", product.batchNumber],

    [
      "Manufactured",
      product.manufacturingDate || "—"
    ],

    [
      "Expiry",
      product.expiryDate || "—"
    ],

    [
      "Registered by",
      product.registeredBy || "—"
    ]

  ];


  return (

    <div className="details">

      {rows.map(([label, value]) => (

        <div
          className="detail"
          key={label}
        >

          <span>

            {label}

          </span>


          <strong>

            {value}

          </strong>

        </div>

      ))}

    </div>

  );
}



/* =========================================================
   REGISTER PRODUCT
========================================================= */

function Register() {

  const emptyForm = {

    name: "",

    brand: "",

    manufacturer: "",

    category: "",

    batchNumber: "",

    manufacturingDate: "",

    expiryDate: ""

  };


  const [form, setForm] =
    useState(emptyForm);


  const [message, setMessage] =
    useState(null);


  const [loading, setLoading] =
    useState(false);


  function change(event) {

    const {
      name,
      value
    } = event.target;


    setForm((previous) => ({

      ...previous,

      [name]: value

    }));

  }


  async function submit(event) {

    event.preventDefault();


    setLoading(true);

    setMessage(null);


    try {

      const data =
        await api.register(form);


      setMessage({

        ok: true,

        product: data.product

      });


      setForm(emptyForm);


    } catch (error) {

      setMessage({

        ok: false,

        text:
          error.message ||
          "Registration failed."

      });

    } finally {

      setLoading(false);

    }

  }


  function downloadQR() {

    if (!message?.product?.productId) {
      return;
    }


    const canvas =
      document.getElementById(
        "product-qr-code"
      );


    if (!canvas) {
      return;
    }


    const image =
      canvas.toDataURL("image/png");


    const link =
      document.createElement("a");


    link.href = image;


    link.download =
      `${message.product.productId}-QR.png`;


    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

  }


  return (

    <section className="container narrow">

      <div className="page-heading">

        <div className="eyebrow">

          <PlusCircle size={16} />

          MANUFACTURER PORTAL

        </div>


        <h1>

          Register a genuine product

        </h1>


        <p>

          Create a blockchain-backed identity
          for a product or batch.

        </p>

      </div>


      <form
        className="form-card"
        onSubmit={submit}
      >

        <div className="form-grid">

          <Field
            name="name"
            label="Product name"
            value={form.name}
            onChange={change}
            required
          />


          <Field
            name="brand"
            label="Brand"
            value={form.brand}
            onChange={change}
            required
          />


          <Field
            name="manufacturer"
            label="Manufacturer"
            value={form.manufacturer}
            onChange={change}
            required
          />


          <Field
            name="category"
            label="Category"
            value={form.category}
            onChange={change}
          />


          <Field
            name="batchNumber"
            label="Batch number"
            value={form.batchNumber}
            onChange={change}
            required
          />


          <Field
            name="manufacturingDate"
            label="Manufacturing date"
            type="date"
            value={form.manufacturingDate}
            onChange={change}
          />


          <Field
            name="expiryDate"
            label="Expiry date"
            type="date"
            value={form.expiryDate}
            onChange={change}
          />

        </div>


        <button
          className="btn primary wide"
          type="submit"
          disabled={loading}
        >

          <Blocks size={18} />


          {loading
            ? "Writing to blockchain..."
            : "Register on Blockchain"}

        </button>

      </form>


      {message?.ok && (

        <div className="success-message">

          <CheckCircle2 />


          <div>

            <b>

              Product registered successfully!

            </b>


            <p>

              Product ID:{" "}

              <strong>

                {message.product.productId}

              </strong>

            </p>


            <p>

              Transaction:{" "}

              <code>

                {message.product.transactionHash}

              </code>

            </p>


            <div
              style={{
                marginTop: "20px",
                padding: "20px",
                background: "#ffffff",
                borderRadius: "12px",
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px"
              }}
            >

              <QRCodeCanvas
                id="product-qr-code"
                value={message.product.productId}
                size={220}
                bgColor="#ffffff"
                fgColor="#000000"
                level="H"
                includeMargin={true}
              />


              <strong
                style={{
                  color: "#111111"
                }}
              >

                {message.product.productId}

              </strong>

            </div>


            <div
              className="hero-actions"
              style={{
                marginTop: "16px"
              }}
            >

              <button
                type="button"
                className="btn primary"
                onClick={downloadQR}
              >

                Download QR

              </button>


              <Link
                className="btn secondary"
                to={`/verify?product=${encodeURIComponent(
                  message.product.productId
                )}`}
              >

                Verify Product →

              </Link>

            </div>

          </div>

        </div>

      )}


      {message && !message.ok && (

        <div className="error-message">

          <AlertTriangle />

          {message.text}

        </div>

      )}

    </section>

  );
}



/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false
}) {

  return (

    <label className="field">

      <span>

        {label}

        {required ? " *" : ""}

      </span>


      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
      />

    </label>

  );

}



/* =========================================================
   PRODUCT REGISTRY
   LOGIN REQUIRED
   QR CODE SHOWN FOR EVERY PRODUCT
========================================================= */

function Products() {

  const [products, setProducts] =
    useState([]);


  const [loading, setLoading] =
    useState(true);


  const [error, setError] =
    useState("");


  useEffect(() => {

    async function loadProducts() {

      setLoading(true);

      setError("");


      try {

        const data =
          await api.products();


        setProducts(
          Array.isArray(data?.products)
            ? data.products
            : []
        );


      } catch (error) {

        console.error(
          "Product loading error:",
          error
        );


        setError(
          error.message ||
          "Unable to load product registry."
        );


      } finally {

        setLoading(false);

      }

    }


    loadProducts();

  }, []);


  function downloadQR(product) {

    const canvas =
      document.getElementById(
        `qr-${product.productId}`
      );


    if (!canvas) {
      return;
    }


    const image =
      canvas.toDataURL("image/png");


    const link =
      document.createElement("a");


    link.href = image;


    link.download =
      `${product.productId}-QR.png`;


    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

  }


  return (

    <section className="container">

      <div className="page-heading">

        <div className="eyebrow">

          <Database size={16} />

          REGISTRY

        </div>


        <h1>

          Product registry

        </h1>


        <p>

          Products registered through BlockVerify
          are backed by blockchain records.

        </p>

      </div>


      {error && (

        <div className="error-message">

          <AlertTriangle size={20} />

          <span>

            {error}

          </span>

        </div>

      )}


      <div className="table-wrap">

        <table>

          <thead>

            <tr>

              <th>
                Product ID
              </th>

              <th>
                QR Code
              </th>

              <th>
                Product
              </th>

              <th>
                Brand
              </th>

              <th>
                Manufacturer
              </th>

              <th>
                Batch
              </th>

              <th>
                Transaction
              </th>

              <th>
                Verify
              </th>

            </tr>

          </thead>


          <tbody>

            {loading && (

              <tr>

                <td
                  colSpan="8"
                  className="empty"
                >

                  Loading products...

                </td>

              </tr>

            )}


            {!loading &&
              !error &&
              products.length === 0 && (

                <tr>

                  <td
                    colSpan="8"
                    className="empty"
                  >

                    No products registered yet.

                  </td>

                </tr>

              )}


            {!loading &&
              products.map((product) => (

                <tr
                  key={product.productId}
                >

                  {/* PRODUCT ID */}

                  <td>

                    <Link
                      to={`/verify?product=${encodeURIComponent(
                        product.productId
                      )}`}
                      className="id-link"
                    >

                      {product.productId}

                    </Link>

                  </td>


                  {/* QR CODE */}

                  <td>

                    <div
                      style={{
                        background: "#ffffff",
                        padding: "10px",
                        borderRadius: "10px",
                        display: "inline-flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "8px"
                      }}
                    >

                      <QRCodeCanvas
                        id={`qr-${product.productId}`}
                        value={product.productId}
                        size={100}
                        bgColor="#ffffff"
                        fgColor="#000000"
                        level="H"
                        includeMargin={true}
                      />


                      <small
                        style={{
                          color: "#111111",
                          fontWeight: "600"
                        }}
                      >

                        {product.productId}

                      </small>


                      <button
                        type="button"
                        className="btn secondary"
                        style={{
                          fontSize: "12px",
                          padding: "6px 10px"
                        }}
                        onClick={() =>
                          downloadQR(product)
                        }
                      >

                        Download

                      </button>

                    </div>

                  </td>


                  {/* PRODUCT */}

                  <td>

                    <strong>

                      {product.name || "—"}

                    </strong>

                  </td>


                  {/* BRAND */}

                  <td>

                    {product.brand || "—"}

                  </td>


                  {/* MANUFACTURER */}

                  <td>

                    {product.manufacturer || "—"}

                  </td>


                  {/* BATCH */}

                  <td>

                    {product.batchNumber || "—"}

                  </td>


                  {/* TRANSACTION */}

                  <td>

                    {product.transactionHash ? (

                      <span
                        className="hash"
                        title={
                          product.transactionHash
                        }
                      >

                        {product.transactionHash.slice(
                          0,
                          12
                        )}

                        ...

                      </span>

                    ) : (

                      "—"

                    )}

                  </td>


                  {/* VERIFY */}

                  <td>

                    <Link
                      className="btn primary"
                      style={{
                        fontSize: "12px",
                        padding: "7px 10px"
                      }}
                      to={`/verify?product=${encodeURIComponent(
                        product.productId
                      )}`}
                    >

                      Verify

                    </Link>

                  </td>

                </tr>

              ))}

          </tbody>

        </table>

      </div>


      {!loading &&
        !error &&
        products.length > 0 && (

          <div
            className="tip"
            style={{
              marginTop: "20px"
            }}
          >

            <ShieldCheck size={22} />

            <div>

              <b>
                Registry information
              </b>

              <p>

                Each registered product has a unique
                product ID and QR code. Scanning the
                QR code opens the verification page,
                where the product can be checked
                against the blockchain.

              </p>

            </div>

          </div>

        )}

    </section>

  );

}



/* =========================================================
   LOGIN / SIGNUP
========================================================= */

function Auth() {

  const [mode, setMode] =
    useState("login");


  const [name, setName] =
    useState("");


  const [email, setEmail] =
    useState("");


  const [password, setPassword] =
    useState("");


  const [loading, setLoading] =
    useState(false);


  const [message, setMessage] =
    useState(null);


  async function submit(event) {

    event.preventDefault();


    setLoading(true);

    setMessage(null);


    try {

      if (mode === "register") {

        await api.registerUser({
          name,
          email,
          password
        });


        setMessage({
          type: "success",
          text:
            "Account created successfully. You can now login."
        });


        setMode("login");

        setPassword("");


      } else {

        const data =
          await api.login({
            email,
            password
          });


        localStorage.setItem(
          "blockverify_token",
          data.token
        );


        localStorage.setItem(
          "blockverify_user",
          JSON.stringify(data.user)
        );


        setMessage({
          type: "success",
          text:
            `Welcome back, ${data.user.name}!`
        });


        setTimeout(() => {

          window.location.href = "/";

        }, 700);

      }


    } catch (error) {

      setMessage({
        type: "error",
        text:
          error.message ||
          "Authentication failed."
      });

    } finally {

      setLoading(false);

    }

  }


  return (

    <section className="container narrow auth-page">

      <div className="page-heading">

        <div className="eyebrow">

          <User size={16} />

          {mode === "login"
            ? "ACCOUNT LOGIN"
            : "CREATE ACCOUNT"}

        </div>


        <h1>

          {mode === "login"
            ? "Welcome back"
            : "Create your account"}

        </h1>


        <p>

          {mode === "login"
            ? "Login to access your BlockVerify account."
            : "Create an account to use BlockVerify."}

        </p>

      </div>


      <form
        className="form-card auth-card"
        onSubmit={submit}
      >

        {mode === "register" && (

          <label className="field">

            <span>
              Full name
            </span>


            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Enter your name"
              required
            />

          </label>

        )}


        <label className="field">

          <span>
            Email address
          </span>


          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="Enter your email"
            required
          />

        </label>


        <label className="field">

          <span>
            Password
          </span>


          <input
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="Minimum 6 characters"
            minLength="6"
            required
          />

        </label>


        <button
          className="btn primary wide"
          disabled={loading}
          type="submit"
        >

          {loading
            ? "Please wait..."
            : mode === "login"
              ? "Login"
              : "Create Account"}

        </button>


        {message && (

          <div
            className={
              message.type === "success"
                ? "success-message"
                : "error-message"
            }
          >

            {message.type === "success"
              ? <CheckCircle2 />
              : <AlertTriangle />}


            <span>

              {message.text}

            </span>

          </div>

        )}


        <div className="auth-switch">

          {mode === "login"
            ? "Don't have an account?"
            : "Already have an account?"}


          <button
            type="button"
            onClick={() => {

              setMode(
                mode === "login"
                  ? "register"
                  : "login"
              );

              setMessage(null);

            }}
          >

            {mode === "login"
              ? "Create account"
              : "Login"}

          </button>

        </div>

      </form>

    </section>

  );

}



/* =========================================================
   PROTECTED ROUTE
========================================================= */

function ProtectedRoute({ children }) {

  const token =
    localStorage.getItem(
      "blockverify_token"
    );


  if (!token) {

    return (
      <Navigate
        to="/auth"
        replace
      />
    );

  }


  return children;

}



/* =========================================================
   APP
========================================================= */

export default function App() {

  return (

    <Layout>

      <Routes>

        {/* =========================
            PUBLIC ROUTES
        ========================= */}

        <Route
          path="/"
          element={<Dashboard />}
        />


        <Route
          path="/verify"
          element={<Verify />}
        />


        <Route
          path="/auth"
          element={<Auth />}
        />


        {/* =========================
            LOGIN REQUIRED
        ========================= */}

        <Route
          path="/register"
          element={
            <ProtectedRoute>
              <Register />
            </ProtectedRoute>
          }
        />


        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          }
        />

      </Routes>

    </Layout>

  );

}