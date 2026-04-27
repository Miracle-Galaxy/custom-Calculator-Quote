import { useState, useEffect, useRef } from "react";

// ── PRICING TABLES ────────────────────────────────────────────────────────────
const PROPERTY_TYPES = [
  "Bungalow / Ground Floor Flat",
  "1 Bed House / First Floor Flat",
  "2 Bed House",
  "3 Bed House",
  "4 Bed House",
  "5+ Bed House",
];

const WIN_PRICES = {
  "Bungalow / Ground Floor Flat": 12,
  "1 Bed House / First Floor Flat": 14,
  "2 Bed House": 17,
  "3 Bed House": 21,
  "4 Bed House": 27,
  "5+ Bed House": 34,
};

const CONS_ROOF_SIZES = ["Small (Lean-To)", "Medium (Standard)", "Large", "Extra Large"];
const CONS_ROOF_PRICES = { "Small (Lean-To)": 95, "Medium (Standard)": 140, "Large": 185, "Extra Large": 230 };
const CONS_ROOF_FREQS = { "One-off": 0, "Quarterly": 0.10, "6-Monthly": 0.05, "Yearly": 0.15 };

const GUTTER_SF_PRICES = {
  "Bungalow / Ground Floor Flat": [120, 150],
  "1 Bed House / First Floor Flat": [140, 172],
  "2 Bed House": [165, 200],
  "3 Bed House": [200, 245],
  "4 Bed House": [250, 295],
  "5+ Bed House": [300, 355],
};

const GUTTER_CLR_PRICES = {
  "Bungalow / Ground Floor Flat": [65, 85],
  "1 Bed House / First Floor Flat": [75, 95],
  "2 Bed House": [90, 115],
  "3 Bed House": [110, 135],
  "4 Bed House": [135, 165],
  "5+ Bed House": [165, 195],
};

const SERVICES = [
  { id: "windowCleaning",  name: "Window Cleaning",           emoji: "🪟", desc: "Regular exterior window cleaning service" },
  { id: "conservatoryRoof",name: "Conservatory Roof Clean",   emoji: "🏡", desc: "Deep clean of conservatory roof panels" },
  { id: "gutterSoffit",    name: "Gutter, Soffit & Fascia",   emoji: "🏠", desc: "Full gutter & fascia clean" },
  { id: "gutterClearing",  name: "Gutter Clearing",           emoji: "🌿", desc: "Clear blocked gutters & downpipes" },
  { id: "roofCleaning",    name: "Roof Cleaning",             emoji: "🏗️", desc: "Moss & algae treatment — from £600" },
  { id: "solarPanel",      name: "Solar Panel Cleaning",      emoji: "☀️", desc: "Restore panel efficiency" },
  { id: "pressureWashing", name: "Pressure Washing",          emoji: "💧", desc: "Driveways, patios & hard surfaces" },
];

// ── CALC FUNCTIONS ────────────────────────────────────────────────────────────
function calcWindow(details, cfg) {
  let base = WIN_PRICES[details.propertyType] || 0;
  if (cfg.frequency === "6 Weekly") base = Math.round(base * 1.05);
  if (cfg.frequency === "8 Weekly") base = Math.round(base * 1.10);
  if (details.hasConservatory) base += 6;
  if (details.hasExtension) base += 5;
  return { regular: base, uplift: Math.round(base * 0.25), first: Math.round(base * 1.25) };
}
function calcConsRoof(cfg) {
  const base = CONS_ROOF_PRICES[cfg.size] || 0;
  const disc = CONS_ROOF_FREQS[cfg.frequency] || 0;
  return { base, discount: Math.round(base * disc), price: Math.round(base * (1 - disc)) };
}
function calcGutterSF(details, cfg) {
  const row = GUTTER_SF_PRICES[details.propertyType];
  if (!row) return { price: 0, yearly: false };
  const hasX = details.hasConservatory || details.hasExtension;
  let price = row[hasX ? 1 : 0];
  const yearly = cfg.frequency === "Yearly";
  if (yearly) price = Math.round(price * 0.9);
  return { price, yearly };
}
function calcGutterClr(details, cfg) {
  const row = GUTTER_CLR_PRICES[details.propertyType];
  if (!row) return { price: 0, yearly: false };
  const hasX = details.hasConservatory || details.hasExtension;
  let price = row[hasX ? 1 : 0];
  const yearly = cfg.frequency === "Yearly";
  if (yearly) price = Math.round(price * 0.9);
  return { price, yearly };
}
function calcSolar(cfg) {
  const panels = parseInt(cfg.panels) || 0;
  const ppp = cfg.hasAlgae ? 13 : 5;
  const cleaning = panels * ppp;
  const scaffold = cfg.needsScaffold ? 150 : 0;
  const bird = cfg.birdProofing ? panels * 8 : 0;
  return { panels, ppp, cleaning, scaffold, bird, total: cleaning + scaffold + bird };
}
function calcPressure(cfg) {
  const sqm = parseFloat(cfg.sqm) || 0;
  let price = 150;
  if (sqm > 15) price += (sqm - 15) * 8.5;
  if (cfg.frequency === "Recurring") price = Math.round(price * 0.9);
  return { price: Math.round(Math.max(150, price)), sqm };
}

// ── SHARED UI ─────────────────────────────────────────────────────────────────
const inputStyle = {
  width: "100%", padding: "10px 14px", border: "1.5px solid #e2e8f0",
  borderRadius: 8, fontSize: 15, outline: "none", boxSizing: "border-box",
  color: "#1e293b", background: "#fff", fontFamily: "'Outfit', sans-serif",
};
const labelStyle = {
  display: "block", fontSize: 12, fontWeight: 700, color: "#475569",
  marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.6px",
};

function Inp({ label, value, onChange, type = "text", placeholder = "", required, half }) {
  return (
    <div style={{ marginBottom: 14, ...(half ? {} : {}) }}>
      <label style={labelStyle}>{label}{required && <span style={{ color: "#ef4444" }}> *</span>}</label>
      <input
        type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={inputStyle}
        onFocus={e => (e.target.style.border = "1.5px solid #0ea5e9")}
        onBlur={e => (e.target.style.border = "1.5px solid #e2e8f0")}
      />
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder = "", rows = 3 }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      <textarea
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} rows={rows}
        style={{ ...inputStyle, resize: "vertical" }}
        onFocus={e => (e.target.style.border = "1.5px solid #0ea5e9")}
        onBlur={e => (e.target.style.border = "1.5px solid #e2e8f0")}
      />
    </div>
  );
}

function RadioGroup({ label, options, value, onChange, wrap = true }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <div style={labelStyle}>{label}</div>}
      <div style={{ display: "flex", flexWrap: wrap ? "wrap" : "nowrap", gap: 8 }}>
        {options.map(opt => {
          const active = value === opt;
          return (
            <button key={opt} type="button" onClick={() => onChange(opt)} style={{
              padding: "8px 16px", borderRadius: 8, border: `2px solid ${active ? "#0ea5e9" : "#e2e8f0"}`,
              background: active ? "#eff8ff" : "white", cursor: "pointer", fontSize: 14, fontWeight: 600,
              color: active ? "#0284c7" : "#64748b", transition: "all 0.15s", fontFamily: "'Outfit', sans-serif",
            }}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Toggle({ label, sublabel, checked, onChange }) {
  return (
    <div onClick={() => onChange(!checked)} style={{
      display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 8,
      border: `1.5px solid ${checked ? "#0ea5e9" : "#e2e8f0"}`, cursor: "pointer",
      background: checked ? "#f0f9ff" : "white", marginBottom: 8, transition: "all 0.15s",
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: 5, border: `2px solid ${checked ? "#0ea5e9" : "#cbd5e1"}`,
        background: checked ? "#0ea5e9" : "white", display: "flex", alignItems: "center",
        justifyContent: "center", flexShrink: 0, transition: "all 0.15s",
      }}>
        {checked && <span style={{ color: "white", fontSize: 12, lineHeight: 1 }}>✓</span>}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{label}</div>
        {sublabel && <div style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>{sublabel}</div>}
      </div>
    </div>
  );
}

function PriceBox({ children }) {
  return (
    <div style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)", borderRadius: 14, padding: "20px 24px", color: "white", marginTop: 18 }}>
      {children}
    </div>
  );
}

function Notice({ children, color = "blue" }) {
  const map = { blue: { bg: "#f0f9ff", border: "#bae6fd", text: "#0369a1" }, amber: { bg: "#fffbeb", border: "#fcd34d", text: "#92400e" }, green: { bg: "#f0fdf4", border: "#86efac", text: "#166534" } };
  const c = map[color];
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: "12px 16px", fontSize: 13, color: c.text, marginTop: 14, lineHeight: 1.6 }}>
      {children}
    </div>
  );
}

function PhotoUpload({ label, files, onFiles }) {
  const ref = useRef();
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <div style={labelStyle}>{label}</div>}
      <div onClick={() => ref.current.click()} style={{ border: "2px dashed #bae6fd", borderRadius: 10, padding: "16px 20px", textAlign: "center", cursor: "pointer", background: "#f8fbff" }}>
        <div style={{ fontSize: 26, marginBottom: 4 }}>📷</div>
        <div style={{ fontSize: 14, color: "#0369a1", fontWeight: 600 }}>Click to add photos</div>
        <div style={{ fontSize: 12, color: "#94a3b8" }}>JPG, PNG up to 10MB each</div>
      </div>
      <input ref={ref} type="file" accept="image/*" multiple style={{ display: "none" }}
        onChange={e => onFiles([...files, ...Array.from(e.target.files).map(f => f.name)])} />
      {files.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {files.map((f, i) => (
            <div key={i} style={{ fontSize: 13, color: "#0369a1", padding: "3px 0" }}>📎 {f}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function StepNav({ onBack, onNext, nextLabel = "Continue", nextDisabled = false }) {
  return (
    <div style={{ display: "flex", gap: 12, marginTop: 28, justifyContent: "space-between", alignItems: "center" }}>
      {onBack ? (
        <button onClick={onBack} style={{ padding: "10px 20px", background: "white", border: "1.5px solid #e2e8f0", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#64748b", fontFamily: "'Outfit', sans-serif" }}>
          ← Back
        </button>
      ) : <div />}
      {onNext && (
        <button onClick={onNext} disabled={nextDisabled} style={{
          padding: "12px 28px", background: nextDisabled ? "#94a3b8" : "linear-gradient(135deg, #0ea5e9, #0369a1)",
          color: "white", border: "none", borderRadius: 8, cursor: nextDisabled ? "not-allowed" : "pointer",
          fontSize: 15, fontWeight: 700, boxShadow: nextDisabled ? "none" : "0 4px 14px rgba(14,165,233,0.35)",
          fontFamily: "'Outfit', sans-serif", transition: "opacity 0.15s",
        }}>
          {nextLabel} →
        </button>
      )}
    </div>
  );
}

function ProgressBar({ current, total, label }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{label || `Step ${current} of ${total}`}</span>
        <span style={{ fontSize: 12, color: "#0ea5e9", fontWeight: 700 }}>{pct}%</span>
      </div>
      <div style={{ height: 5, background: "#e2e8f0", borderRadius: 3 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #38bdf8, #0369a1)", borderRadius: 3, transition: "width 0.5s ease" }} />
      </div>
    </div>
  );
}

// ── SCREEN: LANDING ───────────────────────────────────────────────────────────
function Landing({ onStart }) {
  return (
    <div style={{ textAlign: "center", padding: "56px 32px 48px" }}>
      <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, #bae6fd, #0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 34 }}>✨</div>
      <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, color: "#0c4a6e", margin: "0 0 12px", lineHeight: 1.2 }}>
        Get an Instant Estimate
      </h1>
      <p style={{ color: "#475569", fontSize: 16, margin: "0 auto 32px", maxWidth: 380, lineHeight: 1.6 }}>
        Tell us about your property and chosen services — we'll build a personalised quote in just a few steps.
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginBottom: 36 }}>
        {["Transparent pricing", "No hidden fees", "Free to quote"].map(f => (
          <div key={f} style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 20, padding: "5px 14px", fontSize: 13, color: "#0369a1", fontWeight: 600 }}>
            ✓ {f}
          </div>
        ))}
      </div>
      <button onClick={onStart} style={{ padding: "14px 44px", background: "linear-gradient(135deg, #0ea5e9, #0369a1)", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 17, fontWeight: 700, boxShadow: "0 6px 24px rgba(14,165,233,0.4)", fontFamily: "'Outfit', sans-serif" }}>
        Start My Quote
      </button>
      <div style={{ marginTop: 16, fontSize: 12, color: "#94a3b8" }}>Takes less than 3 minutes</div>
    </div>
  );
}

// ── SCREEN: PATH CHOICE ───────────────────────────────────────────────────────
function PathChoice({ onChoice, onBack }) {
  return (
    <div>
      <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 27, color: "#0c4a6e", margin: "0 0 6px" }}>What type of property?</h2>
      <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 28px", lineHeight: 1.6 }}>We tailor our service approach and pricing for each property type</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {[
          { type: "residential", emoji: "🏡", title: "Residential", sub: "Houses, flats, bungalows & private homes", accent: "#0ea5e9", bg: "#f0f9ff" },
          { type: "commercial",  emoji: "🏢", title: "Commercial",  sub: "Offices, retail, industrial & managed sites", accent: "#7c3aed", bg: "#faf5ff" },
        ].map(({ type, emoji, title, sub, accent, bg }) => (
          <button key={type} onClick={() => onChoice(type)} style={{
            padding: "22px 18px", background: "white", border: "2px solid #e2e8f0", borderRadius: 14,
            cursor: "pointer", textAlign: "left", transition: "all 0.2s", fontFamily: "'Outfit', sans-serif",
          }}
            onMouseOver={e => { e.currentTarget.style.border = `2px solid ${accent}`; e.currentTarget.style.background = bg; }}
            onMouseOut={e => { e.currentTarget.style.border = "2px solid #e2e8f0"; e.currentTarget.style.background = "white"; }}>
            <div style={{ fontSize: 34, marginBottom: 10 }}>{emoji}</div>
            <div style={{ fontWeight: 700, fontSize: 17, color: "#0f172a", marginBottom: 5 }}>{title}</div>
            <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{sub}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── SCREEN: COMMERCIAL FORM ───────────────────────────────────────────────────
function CommercialForm({ onSubmit, onBack }) {
  const [form, setForm] = useState({ businessName: "", contactName: "", email: "", phone: "", address: "", services: "", frequency: "", notes: "", photos: [] });
  const set = k => v => setForm(p => ({ ...p, [k]: v }));
  const canSubmit = form.businessName && form.contactName && form.email && form.phone;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ fontSize: 30 }}>🏢</div>
        <div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: "#0c4a6e", margin: 0 }}>Commercial Enquiry</h2>
          <div style={{ fontSize: 13, color: "#64748b" }}>We'll prepare a bespoke quote for your business</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <Inp label="Business Name" value={form.businessName} onChange={set("businessName")} required />
        <Inp label="Contact Name" value={form.contactName} onChange={set("contactName")} required />
        <Inp label="Email Address" value={form.email} onChange={set("email")} type="email" required />
        <Inp label="Phone Number" value={form.phone} onChange={set("phone")} type="tel" required />
      </div>
      <Inp label="Property / Site Address" value={form.address} onChange={set("address")} placeholder="Full address of the site to be cleaned" />
      <Textarea label="Services Required" value={form.services} onChange={set("services")} placeholder="e.g. Window cleaning, gutter clearing, pressure washing, cladding…" rows={2} />
      <RadioGroup label="Cleaning Frequency" options={["Weekly", "Fortnightly", "Monthly", "Quarterly", "One-off", "To be discussed"]} value={form.frequency} onChange={set("frequency")} />
      <Textarea label="Additional Notes / Access Requirements" value={form.notes} onChange={set("notes")} placeholder="Number of floors, access codes, any special considerations, RAMS required…" />
      <PhotoUpload label="Upload Site Photos (Optional)" files={form.photos} onFiles={set("photos")} />
      <StepNav onBack={onBack} onNext={() => onSubmit(form)} nextLabel="Submit Enquiry" nextDisabled={!canSubmit} />
    </div>
  );
}

// ── SCREEN: COMMERCIAL THANKS ─────────────────────────────────────────────────
function CommercialThanks() {
  return (
    <div style={{ textAlign: "center", padding: "44px 24px" }}>
      <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 34 }}>✅</div>
      <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: "#166534", margin: "0 0 16px" }}>Enquiry Received!</h2>
      <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 14, padding: "20px 24px", textAlign: "left", marginBottom: 20 }}>
        <p style={{ fontSize: 15, color: "#166534", lineHeight: 1.8, margin: 0 }}>
          <strong>Thank you for contacting us!</strong> We've received your commercial cleaning enquiry and a dedicated member of our commercial team will be in touch within <strong>1 business day</strong> with a fully tailored quote based on your requirements.
        </p>
        <p style={{ fontSize: 14, color: "#4ade80", marginTop: 12, marginBottom: 0 }}>
          📧 A confirmation has been noted. We look forward to working with you.
        </p>
      </div>
      <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>In the meantime, feel free to call us directly if you have an urgent requirement.</p>
    </div>
  );
}

// ── SCREEN: RESIDENTIAL DETAILS ───────────────────────────────────────────────
function ResDetails({ details, setDetails, onBack, onNext }) {
  const set = k => v => setDetails(p => ({ ...p, [k]: v }));
  const canNext = details.name && details.email && details.phone && details.propertyType;
  return (
    <div>
      <ProgressBar current={1} total={4} label="Step 1 of 4 — Property Details" />
      <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: "#0c4a6e", margin: "0 0 4px" }}>Your Property Details</h2>
      <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 22px", lineHeight: 1.6 }}>This helps us calculate an accurate quote for your property</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <Inp label="Your Name" value={details.name} onChange={set("name")} required />
        <Inp label="Email Address" value={details.email} onChange={set("email")} type="email" required />
        <Inp label="Phone Number" value={details.phone} onChange={set("phone")} type="tel" required />
        <Inp label="Postcode" value={details.postcode || ""} onChange={set("postcode")} placeholder="e.g. SW1A 1AA" />
      </div>
      <Inp label="Property Address" value={details.address} onChange={set("address")} placeholder="Full property address" />
      <RadioGroup label="Property Type *" options={PROPERTY_TYPES} value={details.propertyType} onChange={set("propertyType")} />
      <div style={{ marginBottom: 16 }}>
        <div style={labelStyle}>Property Additions</div>
        <Toggle label="Conservatory" sublabel="The property has a conservatory" checked={details.hasConservatory} onChange={set("hasConservatory")} />
        <Toggle label="Extension" sublabel="The property has a rear or side extension" checked={details.hasExtension} onChange={set("hasExtension")} />
      </div>
      <RadioGroup label="Preferred Contact Method" options={["Email", "Phone", "Either"]} value={details.preferredContact} onChange={set("preferredContact")} />
      <StepNav onBack={onBack} onNext={onNext} nextDisabled={!canNext} />
    </div>
  );
}

// ── SCREEN: SERVICE SELECTION ─────────────────────────────────────────────────
function ResServices({ selected, setSelected, onBack, onNext }) {
  const toggle = id => setSelected(p => p.includes(id) ? p.filter(s => s !== id) : [...p, id]);
  return (
    <div>
      <ProgressBar current={2} total={4} label="Step 2 of 4 — Choose Services" />
      <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: "#0c4a6e", margin: "0 0 4px" }}>Select Your Services</h2>
      <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 22px", lineHeight: 1.6 }}>Choose one or more — you'll configure pricing details for each on the next steps</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {SERVICES.map(({ id, name, emoji, desc }) => {
          const active = selected.includes(id);
          return (
            <div key={id} onClick={() => toggle(id)} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 12,
              border: `2px solid ${active ? "#0ea5e9" : "#e2e8f0"}`, background: active ? "#f0f9ff" : "white",
              cursor: "pointer", transition: "all 0.15s",
            }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${active ? "#0ea5e9" : "#cbd5e1"}`, background: active ? "#0ea5e9" : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {active && <span style={{ color: "white", fontSize: 13, lineHeight: 1 }}>✓</span>}
              </div>
              <div style={{ fontSize: 24, flexShrink: 0 }}>{emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: active ? "#0284c7" : "#1e293b" }}>{name}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{desc}</div>
              </div>
            </div>
          );
        })}
      </div>
      {selected.length > 0 && (
        <Notice color="blue">✓ {selected.length} service{selected.length !== 1 ? "s" : ""} selected — tap Continue to configure each one</Notice>
      )}
      <StepNav onBack={onBack} onNext={onNext} nextDisabled={selected.length === 0} />
    </div>
  );
}

// ── SERVICE CONFIG SCREENS ────────────────────────────────────────────────────
function WindowConfig({ details, cfg, setCfg }) {
  const set = k => v => setCfg(p => ({ ...p, [k]: v }));
  const calc = cfg.frequency ? calcWindow(details, cfg) : null;
  return (
    <div>
      <RadioGroup label="Cleaning Frequency" options={["4 Weekly", "6 Weekly", "8 Weekly"]} value={cfg.frequency || ""} onChange={set("frequency")} />
      {(details.hasConservatory || details.hasExtension) && (
        <Notice color="blue">
          {details.hasConservatory && "🏡 Conservatory add-on +£6 per visit"}
          {details.hasConservatory && details.hasExtension && " · "}
          {details.hasExtension && "🏠 Extension add-on +£5 per visit"}
          {" — already factored into the price below"}
        </Notice>
      )}
      {calc && (
        <PriceBox>
          <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>Per clean · {cfg.frequency}</div>
          <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1 }}>£{calc.regular}</div>
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.25)" }}>
            <div style={{ fontSize: 13, opacity: 0.8 }}>First clean (25% one-off uplift)</div>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 2 }}>
              £{calc.first}
              <span style={{ fontSize: 13, opacity: 0.8, marginLeft: 8 }}>(£{calc.regular} + £{calc.uplift} first-clean charge)</span>
            </div>
          </div>
        </PriceBox>
      )}
    </div>
  );
}

function ConsRoofConfig({ cfg, setCfg }) {
  const set = k => v => setCfg(p => ({ ...p, [k]: v }));
  const calc = cfg.size && cfg.frequency ? calcConsRoof(cfg) : null;
  return (
    <div>
      <RadioGroup label="Conservatory Size" options={CONS_ROOF_SIZES} value={cfg.size || ""} onChange={set("size")} />
      <RadioGroup label="Frequency" options={["One-off", "Quarterly", "6-Monthly", "Yearly"]} value={cfg.frequency || ""} onChange={set("frequency")} />
      {calc && (
        <PriceBox>
          <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>
            Estimated price{cfg.frequency !== "One-off" ? ` · ${cfg.frequency}` : ""}
          </div>
          <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1 }}>£{calc.price}</div>
          {calc.discount > 0 && (
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 15, opacity: 0.65, textDecoration: "line-through" }}>£{calc.base}</span>
              <span style={{ background: "rgba(255,255,255,0.2)", padding: "2px 10px", borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
                Save £{calc.discount} · {Math.round((calc.discount / calc.base) * 100)}% off
              </span>
            </div>
          )}
        </PriceBox>
      )}
    </div>
  );
}

function GutterSFConfig({ details, cfg, setCfg }) {
  const set = k => v => setCfg(p => ({ ...p, [k]: v }));
  const hasX = details.hasConservatory || details.hasExtension;
  const calc = cfg.frequency ? calcGutterSF(details, cfg) : null;
  return (
    <div>
      {hasX && <Notice color="blue">🏡 Conservatory/extension pricing automatically included in your estimate</Notice>}
      <RadioGroup label="Service Frequency" options={["One-off", "Yearly"]} value={cfg.frequency || ""} onChange={set("frequency")} />
      {calc && (
        <PriceBox>
          <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>Estimated price · {cfg.frequency}</div>
          <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1 }}>£{calc.price}</div>
          {calc.yearly && <div style={{ fontSize: 13, marginTop: 8, opacity: 0.85 }}>✓ 10% yearly recurring discount applied</div>}
        </PriceBox>
      )}
    </div>
  );
}

function GutterClrConfig({ details, cfg, setCfg }) {
  const set = k => v => setCfg(p => ({ ...p, [k]: v }));
  const hasX = details.hasConservatory || details.hasExtension;
  const calc = cfg.frequency ? calcGutterClr(details, cfg) : null;
  return (
    <div>
      {hasX && <Notice color="blue">🏡 Conservatory/extension pricing included in your estimate</Notice>}
      <RadioGroup label="Service Frequency" options={["One-off", "Yearly"]} value={cfg.frequency || ""} onChange={set("frequency")} />
      {calc && (
        <PriceBox>
          <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>Estimated price · {cfg.frequency}</div>
          <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1 }}>£{calc.price}</div>
          {calc.yearly && <div style={{ fontSize: 13, marginTop: 8, opacity: 0.85 }}>✓ 10% yearly recurring discount applied</div>}
        </PriceBox>
      )}
    </div>
  );
}

function RoofCleaningConfig({ cfg, setCfg }) {
  const set = k => v => setCfg(p => ({ ...p, [k]: v }));
  return (
    <div>
      <Notice color="amber">
        <strong>📋 Survey Required Before Pricing</strong><br />
        Roof cleaning costs vary based on roof size, pitch, material type and moss/lichen coverage.
        We provide an accurate quote following a <strong>free no-obligation survey</strong>.
        Prices <strong>start from £600</strong>.
      </Notice>
      <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 10, padding: "14px 18px", margin: "14px 0", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 28 }}>🏷️</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#92400e" }}>Indicative price: From £600</div>
          <div style={{ fontSize: 13, color: "#a16207" }}>Final quote confirmed after your free survey</div>
        </div>
      </div>
      <PhotoUpload label="Upload Photos of Your Roof (Recommended)" files={cfg.photos || []} onFiles={f => set("photos")(f)} />
      <Textarea label="Additional Notes" value={cfg.notes || ""} onChange={set("notes")} placeholder="Describe any visible moss, algae, dark streaks, or areas of concern…" />
    </div>
  );
}

function SolarConfig({ cfg, setCfg }) {
  const set = k => v => setCfg(p => ({ ...p, [k]: v }));
  const calc = parseInt(cfg.panels) > 0 ? calcSolar(cfg) : null;
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={labelStyle}>Number of Solar Panels</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input
            type="number" min="1" max="200"
            value={cfg.panels || ""} onChange={e => set("panels")(e.target.value)}
            placeholder="e.g. 14"
            style={{ ...inputStyle, width: 100 }}
            onFocus={e => (e.target.style.border = "1.5px solid #0ea5e9")}
            onBlur={e => (e.target.style.border = "1.5px solid #e2e8f0")}
          />
          <span style={{ fontSize: 13, color: "#64748b" }}>panels</span>
        </div>
      </div>
      <Toggle label="Lichen or Algae Present?" sublabel="Requires specialist biocide treatment — £13/panel instead of £5/panel" checked={!!cfg.hasAlgae} onChange={set("hasAlgae")} />
      <Toggle label="Difficult Access / Steep Pitch?" sublabel="May require scaffold hire — +£150 charge if needed" checked={!!cfg.needsScaffold} onChange={set("needsScaffold")} />
      <Toggle label="Add Bird Proofing?" sublabel="Mesh/spike proofing to prevent nesting under panels — £8 per panel" checked={!!cfg.birdProofing} onChange={set("birdProofing")} />
      <PhotoUpload label="Upload Photos (Optional)" files={cfg.photos || []} onFiles={set("photos")} />
      {calc && (
        <PriceBox>
          <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>Estimated total</div>
          <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1 }}>£{calc.total}</div>
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.2)", display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 13, opacity: 0.9 }}>Panel clean: {calc.panels} × £{calc.ppp} = £{calc.cleaning}</div>
            {calc.scaffold > 0 && <div style={{ fontSize: 13, opacity: 0.9 }}>Scaffold hire: £{calc.scaffold}</div>}
            {calc.bird > 0 && <div style={{ fontSize: 13, opacity: 0.9 }}>Bird proofing: {calc.panels} × £8 = £{calc.bird}</div>}
          </div>
        </PriceBox>
      )}
    </div>
  );
}

function PressureConfig({ cfg, setCfg }) {
  const set = k => v => setCfg(p => ({ ...p, [k]: v }));
  const calc = parseFloat(cfg.sqm) > 0 && cfg.frequency ? calcPressure(cfg) : null;
  return (
    <div>
      <RadioGroup label="Surface Type" options={["Patio", "Driveway", "Path / Walkway", "Decking", "Block Paving", "Other"]} value={cfg.surface || ""} onChange={set("surface")} />
      <div style={{ marginBottom: 16 }}>
        <div style={labelStyle}>Surface Area</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input
            type="number" min="1"
            value={cfg.sqm || ""} onChange={e => set("sqm")(e.target.value)}
            placeholder="e.g. 25"
            style={{ ...inputStyle, width: 100 }}
            onFocus={e => (e.target.style.border = "1.5px solid #0ea5e9")}
            onBlur={e => (e.target.style.border = "1.5px solid #e2e8f0")}
          />
          <span style={{ fontSize: 14, color: "#0369a1", fontWeight: 600 }}>m²</span>
        </div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>£150 for first 15m² · +£8.50 per additional m²</div>
      </div>
      <RadioGroup label="Frequency" options={["One-off", "Recurring"]} value={cfg.frequency || ""} onChange={set("frequency")} />
      {cfg.frequency === "Recurring" && <Notice color="green">✓ 10% recurring service discount applied to your estimate</Notice>}
      {calc && (
        <PriceBox>
          <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>Estimated price · {cfg.sqm}m²{cfg.frequency === "Recurring" ? " · Recurring" : ""}</div>
          <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1 }}>£{calc.price}</div>
          {cfg.frequency === "Recurring" && <div style={{ fontSize: 13, marginTop: 8, opacity: 0.85 }}>✓ Recurring 10% discount applied</div>}
        </PriceBox>
      )}
    </div>
  );
}

// ── SERVICE CONFIG WRAPPER ────────────────────────────────────────────────────
function ServiceConfigStep({ svcId, details, cfg, setCfg, onBack, onNext, stepNum, totalSteps, isLast }) {
  const svc = SERVICES.find(s => s.id === svcId);
  const canProceed = () => {
    switch (svcId) {
      case "windowCleaning":   return !!cfg.frequency;
      case "conservatoryRoof": return !!(cfg.size && cfg.frequency);
      case "gutterSoffit":     return !!cfg.frequency;
      case "gutterClearing":   return !!cfg.frequency;
      case "roofCleaning":     return true;
      case "solarPanel":       return parseInt(cfg.panels) > 0;
      case "pressureWashing":  return !!(parseFloat(cfg.sqm) > 0 && cfg.frequency);
      default: return false;
    }
  };
  return (
    <div>
      <ProgressBar current={stepNum} total={totalSteps} label={`Service ${stepNum - 2} of ${totalSteps - 3} — Configure`} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22, padding: "14px 16px", background: "#f8fbff", borderRadius: 10, border: "1px solid #bae6fd" }}>
        <span style={{ fontSize: 30 }}>{svc?.emoji}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 17, color: "#0c4a6e" }}>{svc?.name}</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>Configure your preferences and see your estimate</div>
        </div>
      </div>
      {svcId === "windowCleaning"   && <WindowConfig details={details} cfg={cfg} setCfg={setCfg} />}
      {svcId === "conservatoryRoof" && <ConsRoofConfig cfg={cfg} setCfg={setCfg} />}
      {svcId === "gutterSoffit"     && <GutterSFConfig details={details} cfg={cfg} setCfg={setCfg} />}
      {svcId === "gutterClearing"   && <GutterClrConfig details={details} cfg={cfg} setCfg={setCfg} />}
      {svcId === "roofCleaning"     && <RoofCleaningConfig cfg={cfg} setCfg={setCfg} />}
      {svcId === "solarPanel"       && <SolarConfig cfg={cfg} setCfg={setCfg} />}
      {svcId === "pressureWashing"  && <PressureConfig cfg={cfg} setCfg={setCfg} />}
      <StepNav onBack={onBack} onNext={onNext} nextLabel={isLast ? "View My Quote" : "Next Service"} nextDisabled={!canProceed()} />
    </div>
  );
}

// ── SCREEN: QUOTE SUMMARY ─────────────────────────────────────────────────────
function QuoteSummary({ details, selected, cfgs, onRestart }) {
  const getResult = id => {
    const cfg = cfgs[id] || {};
    switch (id) {
      case "windowCleaning":   return cfg.frequency ? calcWindow(details, cfg) : null;
      case "conservatoryRoof": return cfg.size && cfg.frequency ? calcConsRoof(cfg) : null;
      case "gutterSoffit":     return cfg.frequency ? calcGutterSF(details, cfg) : null;
      case "gutterClearing":   return cfg.frequency ? calcGutterClr(details, cfg) : null;
      case "roofCleaning":     return { enquiry: true };
      case "solarPanel":       return parseInt(cfg.panels) > 0 ? calcSolar(cfg) : null;
      case "pressureWashing":  return parseFloat(cfg.sqm) > 0 ? calcPressure(cfg) : null;
      default: return null;
    }
  };
  const getPrice = (id, r) => {
    if (!r || r.enquiry) return null;
    switch (id) {
      case "windowCleaning":   return r.regular;
      case "conservatoryRoof": return r.price;
      case "gutterSoffit":
      case "gutterClearing":   return r.price;
      case "solarPanel":       return r.total;
      case "pressureWashing":  return r.price;
      default: return null;
    }
  };
  const serviceRows = selected.map(id => { const svc = SERVICES.find(s => s.id === id); const r = getResult(id); return { ...svc, result: r, price: getPrice(id, r) }; });
  const total = serviceRows.reduce((s, r) => s + (r.price || 0), 0);
  const hasEnquiry = serviceRows.some(r => r.id === "roofCleaning");

  const getSubline = (id, r) => {
    const cfg = cfgs[id] || {};
    switch (id) {
      case "windowCleaning":   return r ? `${cfg.frequency} · First clean £${r.first} (25% uplift)` : "";
      case "conservatoryRoof": return r ? `${cfg.size} · ${cfg.frequency}${r.discount > 0 ? ` · Save £${r.discount}` : ""}` : "";
      case "gutterSoffit":
      case "gutterClearing":   return r ? `${cfg.frequency}${r.yearly ? " · 10% discount" : ""}` : "";
      case "roofCleaning":     return "Survey required · Quote to follow";
      case "solarPanel":       return r ? `${r.panels} panels · £${r.ppp}/panel${r.scaffold > 0 ? " · Scaffold incl." : ""}${r.bird > 0 ? " · Bird proofing incl." : ""}` : "";
      case "pressureWashing":  return r ? `${cfg.sqm}m² · ${cfg.surface || "Surface"} · ${cfg.frequency}` : "";
      default: return "";
    }
  };

  return (
    <div>
      <ProgressBar current={4} total={4} label="Your Quote — Step 4 of 4" />
      <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: "#0c4a6e", margin: "0 0 4px" }}>Your Personalised Estimate</h2>
      <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 22px", lineHeight: 1.6 }}>
        For <strong>{details.propertyType}</strong>{details.address ? ` at ${details.address}` : ""}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
        {serviceRows.map(({ id, name, emoji, result, price }) => (
          <div key={id} style={{ border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "14px 18px", background: "white" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 24 }}>{emoji}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>{name}</div>
                  <div style={{ fontSize: 12, color: id === "roofCleaning" ? "#d97706" : "#64748b", marginTop: 2 }}>
                    {getSubline(id, result)}
                  </div>
                </div>
              </div>
              <div style={{ flexShrink: 0, textAlign: "right", marginLeft: 12 }}>
                {price != null ? (
                  <span style={{ fontWeight: 800, fontSize: 22, color: "#0284c7" }}>£{price}</span>
                ) : (
                  <span style={{ fontWeight: 700, fontSize: 15, color: "#d97706" }}>From £600</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {total > 0 && (
        <div style={{ background: "linear-gradient(135deg, #0c4a6e 0%, #0369a1 100%)", borderRadius: 14, padding: "22px 24px", color: "white", marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 4 }}>
                Total Estimate{hasEnquiry ? " (excl. roof cleaning)" : ""}
              </div>
              <div style={{ fontSize: 42, fontWeight: 800, lineHeight: 1 }}>£{total}</div>
              {hasEnquiry && <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>+ Roof cleaning: quote follows after survey</div>}
            </div>
            <div style={{ fontSize: 44, opacity: 0.8 }}>✨</div>
          </div>
        </div>
      )}

      <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 12, padding: "16px 20px", fontSize: 14, color: "#0369a1", lineHeight: 1.7, marginBottom: 20 }}>
        <strong>📞 What happens next?</strong><br />
        Our team will review your estimate and contact you via <strong>{details.preferredContact?.toLowerCase()}</strong> to confirm your booking, answer any questions, and arrange a convenient start date.<br />
        <span style={{ fontSize: 13, opacity: 0.8 }}>This is an estimate only — final pricing is confirmed in writing before any work begins.</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
        <button onClick={onRestart} style={{ padding: "12px", background: "white", border: "1.5px solid #e2e8f0", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#64748b", fontFamily: "'Outfit', sans-serif" }}>
          New Quote
        </button>
        <button style={{ padding: "12px", background: "linear-gradient(135deg, #0ea5e9, #0369a1)", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 15, fontWeight: 700, boxShadow: "0 4px 14px rgba(14,165,233,0.35)", fontFamily: "'Outfit', sans-serif" }}>
          📧 Send Me This Quote
        </button>
      </div>
    </div>
  );
}

// ── ROOT APP ──────────────────────────────────────────────────────────────────
export default function QuoteCalculator() {
  const [step, setStep] = useState("landing");
  const [details, setDetails] = useState({ name: "", email: "", phone: "", postcode: "", address: "", propertyType: "", hasConservatory: false, hasExtension: false, preferredContact: "Email" });
  const [selectedServices, setSelectedServices] = useState([]);
  const [serviceConfigs, setServiceConfigs] = useState({});
  const [svcIdx, setSvcIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (document.querySelector("#cleanquote-fonts")) return;
    const link = document.createElement("link");
    link.id = "cleanquote-fonts";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=DM+Serif+Display&display=swap";
    document.head.appendChild(link);
  }, []);

  const go = newStep => {
    setFade(false);
    setTimeout(() => { setStep(newStep); setFade(true); }, 180);
  };

  const updateCfg = (id, updater) => {
    setServiceConfigs(prev => ({ ...prev, [id]: typeof updater === "function" ? updater(prev[id] || {}) : updater }));
  };

  // total progress steps: details(1) + services(2) + n service configs + summary
  const totalSteps = 3 + selectedServices.length + 1;

  const renderStep = () => {
    switch (step) {
      case "landing":
        return <Landing onStart={() => go("pathChoice")} />;
      case "pathChoice":
        return <PathChoice onChoice={t => go(t === "residential" ? "resDetails" : "commercial")} onBack={() => go("landing")} />;
      case "commercial":
        return <CommercialForm onSubmit={() => go("commercialThanks")} onBack={() => go("pathChoice")} />;
      case "commercialThanks":
        return <CommercialThanks />;
      case "resDetails":
        return <ResDetails details={details} setDetails={setDetails} onBack={() => go("pathChoice")} onNext={() => go("resServices")} />;
      case "resServices":
        return <ResServices selected={selectedServices} setSelected={setSelectedServices} onBack={() => go("resDetails")} onNext={() => { setSvcIdx(0); go("svcConfig"); }} />;
      case "svcConfig": {
        const id = selectedServices[svcIdx];
        const isLast = svcIdx === selectedServices.length - 1;
        return (
          <ServiceConfigStep
            svcId={id}
            details={details}
            cfg={serviceConfigs[id] || {}}
            setCfg={upd => updateCfg(id, upd)}
            onBack={() => { if (svcIdx === 0) go("resServices"); else setSvcIdx(i => i - 1); }}
            onNext={() => { if (isLast) go("summary"); else setSvcIdx(i => i + 1); }}
            stepNum={3 + svcIdx}
            totalSteps={totalSteps}
            isLast={isLast}
          />
        );
      }
      case "summary":
        return (
          <QuoteSummary
            details={details}
            selected={selectedServices}
            cfgs={serviceConfigs}
            onRestart={() => {
              setDetails({ name: "", email: "", phone: "", postcode: "", address: "", propertyType: "", hasConservatory: false, hasExtension: false, preferredContact: "Email" });
              setSelectedServices([]);
              setServiceConfigs({});
              go("landing");
            }}
          />
        );
      default: return null;
    }
  };

  const showHeader = !["landing", "commercialThanks"].includes(step);

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", minHeight: "100vh", background: "linear-gradient(155deg, #f0f9ff 0%, #e0f2fe 45%, #f0fdf4 100%)", padding: "0 16px 48px" }}>
      {showHeader && (
        <div style={{ maxWidth: 640, margin: "0 auto", paddingTop: 20, paddingBottom: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 9, background: "linear-gradient(135deg, #0ea5e9, #0369a1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>✨</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#0c4a6e", letterSpacing: -0.3 }}>Cleaning Co.</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>Instant Quote Calculator</div>
          </div>
        </div>
      )}
      <div style={{
        maxWidth: 640, margin: "16px auto 0",
        background: "white", borderRadius: 20,
        boxShadow: "0 8px 48px rgba(14,165,233,0.10), 0 2px 8px rgba(0,0,0,0.06)",
        padding: step === "landing" ? "0" : "32px 36px",
        overflow: "hidden",
        opacity: fade ? 1 : 0,
        transform: fade ? "translateY(0)" : "translateY(10px)",
        transition: "opacity 0.18s ease, transform 0.18s ease",
      }}>
        {renderStep()}
      </div>
    </div>
  );
}