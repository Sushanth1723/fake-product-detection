import React from "react";
import { useEffect, useState } from "react";
import { Link, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import {
  ShieldCheck, Search, PackageCheck, Database, PlusCircle,
  LayoutDashboard, Blocks, Menu, X, CheckCircle2, AlertTriangle,
  Copy, ExternalLink
} from "lucide-react";
import { api } from "./api";

function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const links = [
    ["/", "Dashboard", LayoutDashboard],
    ["/verify", "Verify Product", Search],
    ["/register", "Register Product", PlusCircle],
    ["/products", "Product Registry", Database]
  ];

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/" onClick={() => setOpen(false)}>
          <span className="brand-icon"><ShieldCheck size={23} /></span>
          <span>Block<span>Verify</span></span>
        </Link>

        <button className="menu-btn" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>

        <nav className={open ? "nav open" : "nav"}>
          {links.map(([to, label, Icon]) => (
            <Link
              key={to}
              className={location.pathname === to ? "active" : ""}
              to={to}
              onClick={() => setOpen(false)}
            >
              <Icon size={17} /> {label}
            </Link>
          ))}
        </nav>
      </header>
      <main>{children}</main>
      <footer>
        <span>BlockVerify</span> · Blockchain-based product authenticity demo
      </footer>
    </div>
  );
}

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    Promise.all([api.stats(), api.health()])
      .then(([s, h]) => { setStats(s); setHealth(h); })
      .catch(console.error);
  }, []);

  return (
    <section className="container">
      <div className="hero">
        <div>
          <div className="eyebrow"><Blocks size={16} /> BLOCKCHAIN AUTHENTICITY</div>
          <h1>Detect fake products<br />with <span>blockchain.</span></h1>
          <p>
            Register genuine products on an immutable blockchain ledger and
            verify them instantly using a unique product code.
          </p>
          <div className="hero-actions">
            <Link className="btn primary" to="/verify"><Search size={18}/> Verify a Product</Link>
            <Link className="btn secondary" to="/register"><PlusCircle size={18}/> Register Product</Link>
          </div>
        </div>
        <div className="hero-card">
          <div className="chain-orb"><ShieldCheck size={54}/></div>
          <h3>Trust layer</h3>
          <p>Product identity is recorded on-chain so the verification record cannot be silently changed.</p>
          <div className="chain-status">
            <span className={health?.blockchain ? "dot online" : "dot"}></span>
            {health?.blockchain ? "Local blockchain connected" : "Checking blockchain..."}
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <Stat icon={<PackageCheck />} label="Registered Products" value={stats?.totalProducts ?? "—"} />
        <Stat icon={<Database />} label="Brands" value={stats?.brands ?? "—"} />
        <Stat icon={<ShieldCheck />} label="On-chain Records" value={stats?.verifiedOnChain ?? "—"} />
      </div>

      <div className="info-grid">
        <div className="panel">
          <h2>How it works</h2>
          <div className="steps">
            <Step n="01" title="Manufacturer registers" text="Product identity and batch details are sent to the smart contract." />
            <Step n="02" title="Blockchain creates proof" text="The network stores the registration and transaction hash." />
            <Step n="03" title="Customer verifies" text="Enter the product ID to compare it against the blockchain registry." />
          </div>
        </div>
        <div className="panel accent-panel">
          <h2>Why blockchain?</h2>
          <ul className="clean-list">
            <li><CheckCircle2/> Tamper-evident registration</li>
            <li><CheckCircle2/> Transparent verification</li>
            <li><CheckCircle2/> Traceable product history</li>
            <li><CheckCircle2/> No single editable verification record</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function Stat({ icon, label, value }) {
  return <div className="stat-card"><div className="stat-icon">{icon}</div><div><strong>{value}</strong><span>{label}</span></div></div>;
}

function Step({ n, title, text }) {
  return <div className="step"><b>{n}</b><div><h3>{title}</h3><p>{text}</p></div></div>;
}

function Verify() {
  const [id, setId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!id.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      setResult(await api.verify(id.trim()));
    } catch (e) {
      setResult({ success: false, status: "ERROR", message: e.message });
    } finally {
      setLoading(false);
    }
  }

  const authentic = result?.status === "AUTHENTIC";

  return (
    <section className="container narrow">
      <div className="page-heading">
        <div className="eyebrow"><Search size={16}/> PRODUCT VERIFICATION</div>
        <h1>Is your product genuine?</h1>
        <p>Enter the unique product ID printed on the package or QR label.</p>
      </div>

      <form className="verify-box" onSubmit={submit}>
        <label>Product ID</label>
        <div className="input-row">
          <input value={id} onChange={e => setId(e.target.value)} placeholder="Example: FP-A1B2C3D4E5" />
          <button className="btn primary" disabled={loading}>{loading ? "Checking..." : "Verify"}</button>
        </div>
      </form>

      {result && (
        <div className={`result-card ${authentic ? "success" : "danger"}`}>
          <div className="result-top">
            {authentic ? <CheckCircle2 size={48}/> : <AlertTriangle size={48}/>}
            <div>
              <div className="result-status">{result.status}</div>
              <p>{result.message}</p>
            </div>
          </div>

          {result.product && <ProductDetails product={result.product} />}
        </div>
      )}

      <div className="tip">
        <ShieldCheck size={22}/>
        <div><b>Verification tip</b><p>A genuine product must have a matching record in the blockchain registry. A product code alone is not proof unless the blockchain record matches.</p></div>
      </div>
    </section>
  );
}

function ProductDetails({ product }) {
  const rows = [
    ["Product", product.name],
    ["Brand", product.brand],
    ["Manufacturer", product.manufacturer],
    ["Category", product.category],
    ["Batch", product.batchNumber],
    ["Manufactured", product.manufacturingDate || "—"],
    ["Expiry", product.expiryDate || "—"],
    ["Registered by", product.registeredBy]
  ];

  return <div className="details">
    {rows.map(([a,b]) => <div className="detail" key={a}><span>{a}</span><strong>{b}</strong></div>)}
  </div>;
}

function Register() {
  const [form, setForm] = useState({
    name:"", brand:"", manufacturer:"", category:"", batchNumber:"",
    manufacturingDate:"", expiryDate:""
  });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  function change(e) {
    setForm({...form, [e.target.name]: e.target.value});
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const data = await api.register(form);
      setMessage({ ok:true, product:data.product });
      setForm({name:"", brand:"", manufacturer:"", category:"", batchNumber:"", manufacturingDate:"", expiryDate:""});
    } catch (e) {
      setMessage({ ok:false, text:e.message });
    } finally {
      setLoading(false);
    }
  }

  return <section className="container narrow">
    <div className="page-heading">
      <div className="eyebrow"><PlusCircle size={16}/> MANUFACTURER PORTAL</div>
      <h1>Register a genuine product</h1>
      <p>Create a blockchain-backed identity for a product or batch.</p>
    </div>

    <form className="form-card" onSubmit={submit}>
      <div className="form-grid">
        <Field name="name" label="Product name" value={form.name} onChange={change} required />
        <Field name="brand" label="Brand" value={form.brand} onChange={change} required />
        <Field name="manufacturer" label="Manufacturer" value={form.manufacturer} onChange={change} required />
        <Field name="category" label="Category" value={form.category} onChange={change} />
        <Field name="batchNumber" label="Batch number" value={form.batchNumber} onChange={change} required />
        <Field name="manufacturingDate" label="Manufacturing date" type="date" value={form.manufacturingDate} onChange={change} />
        <Field name="expiryDate" label="Expiry date" type="date" value={form.expiryDate} onChange={change} />
      </div>
      <button className="btn primary wide" disabled={loading}>
        <Blocks size={18}/>{loading ? "Writing to blockchain..." : "Register on Blockchain"}
      </button>
    </form>

    {message?.ok && <div className="success-message">
      <CheckCircle2/><div><b>Product registered successfully!</b>
      <p>Product ID: <strong>{message.product.productId}</strong></p>
      <p>Transaction: <code>{message.product.transactionHash}</code></p>
      <Link to={`/verify?product=${message.product.productId}`}>Go to verification →</Link></div>
    </div>}

    {message && !message.ok && <div className="error-message"><AlertTriangle/> {message.text}</div>}
  </section>;
}

function Field({label, name, value, onChange, type="text", required=false}) {
  return <label className="field"><span>{label}{required ? " *" : ""}</span><input name={name} type={type} value={value} onChange={onChange} required={required}/></label>;
}

function Products() {
  const [products, setProducts] = useState([]);
  useEffect(() => { api.products().then(d => setProducts(d.products)).catch(console.error); }, []);

  return <section className="container">
    <div className="page-heading">
      <div className="eyebrow"><Database size={16}/> REGISTRY</div>
      <h1>Product registry</h1>
      <p>Products registered through this demo are backed by the local blockchain.</p>
    </div>

    <div className="table-wrap">
      <table>
        <thead><tr><th>Product ID</th><th>Product</th><th>Brand</th><th>Manufacturer</th><th>Batch</th><th>Transaction</th></tr></thead>
        <tbody>
          {products.length === 0 && <tr><td colSpan="6" className="empty">No products registered yet.</td></tr>}
          {products.map(p => <tr key={p.productId}>
            <td><Link to={`/verify?product=${p.productId}`} className="id-link">{p.productId}</Link></td>
            <td>{p.name}</td><td>{p.brand}</td><td>{p.manufacturer}</td><td>{p.batchNumber}</td>
            <td><span className="hash">{p.transactionHash?.slice(0,12)}...</span></td>
          </tr>)}
        </tbody>
      </table>
    </div>
  </section>;
}

export default function App() {
  return <Layout><Routes>
    <Route path="/" element={<Dashboard/>}/>
    <Route path="/verify" element={<Verify/>}/>
    <Route path="/register" element={<Register/>}/>
    <Route path="/products" element={<Products/>}/>
  </Routes></Layout>;
}
