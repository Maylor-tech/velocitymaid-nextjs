/* VelocityMaid — Booking wizard (UI kit). */
const VM = window.VelocityMaidDesignSystem_2d9dc2;
const { Button, BrandLogo, Card, Badge, Input, Select, FormRow, Checkbox } = VM;

const ic = (name, color, size = 22) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={name==="star"?color:"none"} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,display:"inline-block",verticalAlign:"middle"}} dangerouslySetInnerHTML={{__html:(window.VM_ICON_PATHS&&window.VM_ICON_PATHS[name])||""}} />
);

const STEPS = ["Service", "Home", "Schedule", "Confirm"];

function Stepper({ step }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 36 }}>
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, background: i <= step ? "var(--vm-cyan)" : "var(--vm-surface)", color: i <= step ? "var(--vm-navy)" : "var(--vm-muted)", border: i <= step ? "none" : "1px solid var(--border-default)" }}>{i < step ? "✓" : i + 1}</span>
            <span style={{ fontFamily: "var(--font-body)", fontWeight: i === step ? 600 : 500, fontSize: 14, color: i === step ? "var(--vm-navy)" : "var(--vm-muted)" }}>{s}</span>
          </div>
          {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: i < step ? "var(--vm-cyan)" : "var(--border-default)", margin: "0 14px" }} />}
        </React.Fragment>
      ))}
    </div>
  );
}

function OptionCard({ selected, onClick, icon, title, desc, price }) {
  return (
    <button onClick={onClick} style={{ textAlign: "left", cursor: "pointer", padding: 20, borderRadius: "var(--radius-md)", background: selected ? "var(--vm-cyan-tint)" : "var(--vm-white)", border: selected ? "2px solid var(--vm-cyan)" : "1px solid var(--border-default)", boxShadow: selected ? "var(--shadow-md)" : "none", transition: "all 150ms" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {ic(icon, selected ? "var(--vm-cyan-dark)" : "var(--vm-muted)", 24)}
          <div>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 16, color: "var(--vm-navy)" }}>{title}</div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--vm-muted)", marginTop: 2 }}>{desc}</div>
          </div>
        </div>
        {price && <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, color: "var(--vm-navy)" }}>{price}</span>}
      </div>
    </button>
  );
}

function BookingApp() {
  const [step, setStep] = React.useState(0);
  const [data, setData] = React.useState({ service: "Deep clean", price: 220, beds: "3", baths: "2", date: "", time: "9:00 AM", name: "", email: "", recurring: false });
  const up = (p) => setData((d) => ({ ...d, ...p }));

  const services = [
    { id: "Standard clean", icon: "sparkles", desc: "Regular maintenance", price: 120 },
    { id: "Deep clean", icon: "home", desc: "Top-to-bottom reset", price: 220 },
    { id: "Move in / out", icon: "truck", desc: "Full property reset", price: 320 },
    { id: "STR turnover", icon: "bed-double", desc: "Between-guest reset", price: 225 },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--vm-surface)" }}>
      <header style={{ background: "var(--vm-navy)", padding: "14px 24px" }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}><BrandLogo theme="dark" iconSize={26} showTagline={false} /></div>
      </header>
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "40px 24px" }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 30, color: "var(--vm-navy)", margin: "0 0 6px" }}>Book your clean</h1>
        <p style={{ fontFamily: "var(--font-body)", color: "var(--vm-muted)", margin: "0 0 30px" }}>Takes about two minutes — no account required.</p>
        <Card elevation="feature" padding="lg">
          <Stepper step={step} />

          {step === 0 && (
            <div>
              <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 20, color: "var(--vm-navy)", margin: "0 0 16px" }}>Select your service</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {services.map((s) => <OptionCard key={s.id} selected={data.service === s.id} onClick={() => up({ service: s.id, price: s.price })} icon={s.icon} title={s.id} desc={s.desc} price={`$${s.price}`} />)}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 20, color: "var(--vm-navy)", margin: "0 0 16px" }}>Tell us about your home</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                <FormRow label="Bedrooms" required><Select value={data.beds} onChange={(e) => up({ beds: e.target.value })}><option>1</option><option>2</option><option>3</option><option>4</option><option>5+</option></Select></FormRow>
                <FormRow label="Bathrooms" required><Select value={data.baths} onChange={(e) => up({ baths: e.target.value })}><option>1</option><option>2</option><option>3</option><option>4+</option></Select></FormRow>
                <FormRow label="Street address" required style={{ gridColumn: "1 / -1" }}><Input placeholder="123 Maple St" /></FormRow>
                <FormRow label="City"><Input placeholder="Newark" /></FormRow>
                <FormRow label="ZIP"><Input placeholder="07102" /></FormRow>
              </div>
              <div style={{ marginTop: 18 }}><Checkbox label="This is a short-term rental (Airbnb / VRBO)" /></div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 20, color: "var(--vm-navy)", margin: "0 0 16px" }}>Pick a date &amp; time</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                <FormRow label="Preferred date" required><Input type="date" value={data.date} onChange={(e) => up({ date: e.target.value })} /></FormRow>
                <FormRow label="Arrival window" required><Select value={data.time} onChange={(e) => up({ time: e.target.value })}><option>9:00 AM</option><option>11:00 AM</option><option>1:00 PM</option><option>3:00 PM</option></Select></FormRow>
              </div>
              <div style={{ marginTop: 18 }}><Checkbox label="Make this a recurring weekly clean (save 10%)" checked={data.recurring} onChange={(v) => up({ recurring: v })} /></div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 20, color: "var(--vm-navy)", margin: "0 0 16px" }}>Review &amp; confirm</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 20 }}>
                <FormRow label="Full name" required><Input value={data.name} onChange={(e) => up({ name: e.target.value })} placeholder="Jordan Avery" /></FormRow>
                <FormRow label="Email" required><Input type="email" value={data.email} onChange={(e) => up({ email: e.target.value })} placeholder="you@home.com" /></FormRow>
              </div>
              <div style={{ background: "var(--vm-surface)", borderRadius: "var(--radius-md)", padding: 20 }}>
                {[["Service", data.service], ["Home", `${data.beds} bed · ${data.baths} bath`], ["Schedule", data.date ? `${data.date} · ${data.time}` : `Soonest · ${data.time}`], ["Recurring", data.recurring ? "Weekly (−10%)" : "One-time"]].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontFamily: "var(--font-body)", fontSize: 14 }}><span style={{ color: "var(--vm-muted)" }}>{k}</span><span style={{ color: "var(--vm-navy)", fontWeight: 500 }}>{v}</span></div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border-default)", marginTop: 8, paddingTop: 14 }}>
                  <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, color: "var(--vm-navy)" }}>Estimated total</span>
                  <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 22, color: "var(--vm-cyan-dark)" }}>${data.recurring ? Math.round(data.price * 0.9) : data.price}</span>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ textAlign: "center", padding: "20px 0 10px" }}>
              <span style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--vm-success-bg)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>{ic("check", "var(--vm-success)", 32)}</span>
              <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 24, color: "var(--vm-navy)", margin: 0 }}>You're booked!</h2>
              <p style={{ fontFamily: "var(--font-body)", color: "var(--vm-muted)", marginTop: 10 }}>A confirmation is on its way{data.email ? ` to ${data.email}` : ""}. We'll text you when your specialist is on the way.</p>
              <div style={{ marginTop: 22 }}><Button variant="navyOutline" pill onClick={() => { setStep(0); }}>Book another</Button></div>
            </div>
          )}

          {step < 4 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 30 }}>
              <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>Back</Button>
              <Button variant="navy" onClick={() => setStep((s) => s + 1)}>{step === 3 ? "Confirm booking" : "Continue"}</Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

Object.assign(window, { BookingApp });
