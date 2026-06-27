/* VelocityMaid — Customer Portal: deeper screens.
 * PaymentBalanceCard, PaymentsScreen, ProfileScreen, TipFlow. */
(function(){
const VMs = window.VelocityMaidDesignSystem_2d9dc2;
const { Button, Card, CardTitle, CardDescription, Badge, StatusBadge, Avatar, Alert, Input, Select, FormRow, Switch, Table } = VMs;

const sic = (name, color, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={name === "star" ? color : "none"} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: "inline-block", verticalAlign: "middle" }} dangerouslySetInnerHTML={{ __html: (window.VM_ICON_PATHS && window.VM_ICON_PATHS[name]) || "" }} />
);

/* ---------------- Payment balance card (reusable) ---------------- */
function PaymentBalanceCard({ job, onPay, paid }) {
  const lines = job.lines || [["Service", job.total]];
  return (
    <Card elevation="raised">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <CardTitle style={{ fontSize: 16 }}>Payment</CardTitle>
        {paid ? <Badge variant="success" icon={sic("check", "currentColor", 13)}>Paid in full</Badge> : <Badge variant="warning">Balance due</Badge>}
      </div>
      {lines.map(([k, v]) => (
        <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--vm-muted)" }}><span>{k}</span><span style={{ color: "var(--vm-navy)" }}>{v}</span></div>
      ))}
      <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border-default)", marginTop: 8, paddingTop: 12 }}>
        <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--vm-muted)" }}>{paid ? "Paid" : "Balance due"}</span>
        <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 22, color: paid ? "var(--vm-success)" : "var(--vm-navy)" }}>{paid ? "$0.00" : job.balance || job.total}</span>
      </div>
      {!paid && (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}>
            {sic("credit-card", "var(--vm-muted)", 18)}
            <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--vm-text)" }}>Visa ending 4242</span>
            <span style={{ marginLeft: "auto", fontSize: 12.5, color: "var(--vm-cyan-dark)", fontWeight: 600, cursor: "pointer" }}>Change</span>
          </div>
          <Button variant="navy" fullWidth onClick={onPay}>Pay {job.balance || job.total}</Button>
          <p style={{ margin: 0, fontSize: 12, color: "var(--vm-muted)", textAlign: "center" }}>Securely processed. A receipt is emailed on payment.</p>
        </div>
      )}
    </Card>
  );
}

/* ---------------- Payments screen ---------------- */
function PaymentsScreen() {
  const invoices = [
    { id: "INV-2052", date: "Jun 30", service: "Standard clean", amount: "$120.00", status: "pending" },
    { id: "INV-1990", date: "Jun 12", service: "Deep clean", amount: "$220.00", status: "completed" },
    { id: "INV-1944", date: "Jun 5", service: "Standard clean", amount: "$120.00", status: "completed" },
    { id: "INV-1900", date: "May 28", service: "Move-out clean", amount: "$320.00", status: "cancelled" },
  ];
  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 26, color: "var(--vm-navy)", margin: "0 0 6px" }}>Payments</h1>
      <p style={{ fontFamily: "var(--font-body)", color: "var(--vm-muted)", margin: "0 0 24px" }}>Balances, receipts, and payment methods.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Alert variant="warning" title="One balance due" icon={sic("alert-circle", "currentColor", 16)}>
            Your Jun 30 standard clean has a <strong>$120.00</strong> balance. It will auto-charge your Visa ·4242 on the service date.
          </Alert>
          <Card elevation="raised" padding="none" style={{ overflow: "hidden" }}>
            <div style={{ padding: "16px 20px 4px" }}><CardTitle style={{ fontSize: 16 }}>Billing history</CardTitle></div>
            <div style={{ padding: "8px 16px 16px" }}>
              <Table columns={[
                { key: "id", header: "Invoice" },
                { key: "date", header: "Date" },
                { key: "service", header: "Service" },
                { key: "status", header: "Status", render: (v) => <StatusBadge status={v} /> },
                { key: "amount", header: "Amount", align: "right" },
              ]} rows={invoices} getRowKey={(r) => r.id} />
            </div>
          </Card>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card elevation="raised">
            <CardTitle style={{ fontSize: 16, marginBottom: 4 }}>Payment methods</CardTitle>
            <CardDescription style={{ marginBottom: 14 }}>Used for bookings and balances.</CardDescription>
            {[["Visa", "4242", true], ["Mastercard", "8810", false]].map(([brand, last, dflt]) => (
              <div key={last} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderTop: "1px solid var(--border-default)" }}>
                {sic("credit-card", "var(--vm-navy)", 20)}
                <div style={{ flex: 1 }}><div style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 500, color: "var(--vm-navy)" }}>{brand} ·{last}</div><div style={{ fontSize: 12, color: "var(--vm-muted)" }}>Expires 08/27</div></div>
                {dflt && <Badge variant="cyan">Default</Badge>}
              </div>
            ))}
            <div style={{ marginTop: 14 }}><Button variant="navyOutline" size="sm" fullWidth iconLeft={sic("plus", "var(--vm-navy)", 16)}>Add card</Button></div>
          </Card>
          <Card elevation="raised">
            <CardTitle style={{ fontSize: 16, marginBottom: 4 }}>Auto-pay</CardTitle>
            <CardDescription style={{ marginBottom: 12 }}>Charge the default card when a clean completes.</CardDescription>
            <Switch label="Auto-pay enabled" defaultChecked />
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Tip / thank-you QR flow ---------------- */
function FauxQR({ size = 132, fg = "var(--vm-navy)" }) {
  // Deterministic faux-QR matrix (placeholder for a real generated code).
  const N = 21; const cells = [];
  const finder = (r, c) => (r < 7 && c < 7) || (r < 7 && c >= N - 7) || (r >= N - 7 && c < 7);
  const inFinder = (r, c) => {
    const local = (rr, cc) => (rr === 0 || rr === 6 || cc === 0 || cc === 6 || (rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4));
    if (r < 7 && c < 7) return local(r, c);
    if (r < 7 && c >= N - 7) return local(r, c - (N - 7));
    if (r >= N - 7 && c < 7) return local(r - (N - 7), c);
    return false;
  };
  let seed = 7;
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const on = finder(r, c) ? inFinder(r, c) : (seed % 100) > 55;
    if (on) cells.push(<rect key={r + "-" + c} x={c} y={r} width="1" height="1" fill={fg} />);
  }
  return <svg width={size} height={size} viewBox={`-1 -1 ${N + 2} ${N + 2}`} style={{ background: "#fff", borderRadius: 10, padding: 6 }}>{cells}</svg>;
}

function TipFlow({ cleaner = "Mike Rivera", onClose }) {
  const [stage, setStage] = React.useState("amount"); // amount → method → done
  const [amount, setAmount] = React.useState(10);
  const [custom, setCustom] = React.useState("");
  const presets = [5, 10, 15, 20];
  const value = custom ? Number(custom) || 0 : amount;
  return (
    <div style={{ maxWidth: 460, margin: "0 auto" }}>
      <Card elevation="feature">
        {stage !== "done" && (
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <Avatar name={cleaner} size="lg" style={{ margin: "0 auto 12px" }} />
            <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 22, color: "var(--vm-navy)", margin: 0 }}>Say thanks to {cleaner.split(" ")[0]}</h2>
            <p style={{ fontFamily: "var(--font-body)", color: "var(--vm-muted)", margin: "6px 0 0", fontSize: 14 }}>100% of your tip goes directly to your specialist.</p>
          </div>
        )}

        {stage === "amount" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
              {presets.map((p) => (
                <button key={p} onClick={() => { setAmount(p); setCustom(""); }} style={{ cursor: "pointer", padding: "14px 0", borderRadius: "var(--radius-md)", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 18, background: !custom && amount === p ? "var(--vm-cyan-tint)" : "var(--vm-white)", border: !custom && amount === p ? "2px solid var(--vm-cyan)" : "1px solid var(--border-default)", color: "var(--vm-navy)" }}>${p}</button>
              ))}
            </div>
            <FormRow label="Custom amount"><Input type="number" placeholder="Enter amount" value={custom} onChange={(e) => setCustom(e.target.value)} /></FormRow>
            <div style={{ marginTop: 18 }}><Button variant="navy" fullWidth disabled={value <= 0} onClick={() => setStage("method")}>Continue · ${value}</Button></div>
            <button onClick={onClose} style={{ width: "100%", marginTop: 10, background: "none", border: "none", color: "var(--vm-muted)", fontFamily: "var(--font-body)", fontSize: 13, cursor: "pointer" }}>Maybe later</button>
          </div>
        )}

        {stage === "method" && (
          <div>
            <div style={{ background: "var(--vm-surface)", borderRadius: "var(--radius-md)", padding: 18, textAlign: "center", marginBottom: 16 }}>
              <p style={{ fontFamily: "var(--font-heading)", textTransform: "uppercase", letterSpacing: "0.16em", fontSize: 11, color: "var(--vm-muted)", margin: "0 0 12px" }}>Scan to tip ${value}</p>
              <div style={{ display: "flex", justifyContent: "center" }}><FauxQR /></div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--vm-muted)", margin: "12px 0 0" }}>Open your camera, or pay with a saved card below.</p>
            </div>
            <Button variant="cyan" fullWidth pill onClick={() => setStage("done")}>Tip ${value} with Visa ·4242</Button>
            <button onClick={() => setStage("amount")} style={{ width: "100%", marginTop: 10, background: "none", border: "none", color: "var(--vm-muted)", fontFamily: "var(--font-body)", fontSize: 13, cursor: "pointer" }}>Back</button>
          </div>
        )}

        {stage === "done" && (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <span style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--vm-success-bg)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>{sic("check", "var(--vm-success)", 32)}</span>
            <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 24, color: "var(--vm-navy)", margin: 0 }}>Thank you!</h2>
            <p style={{ fontFamily: "var(--font-body)", color: "var(--vm-muted)", marginTop: 10 }}>Your ${value} tip is on its way to {cleaner}. They'll be delighted.</p>
            <div style={{ display: "flex", gap: 4, justifyContent: "center", margin: "16px 0" }}>{[0,1,2,3,4].map(i => sic("star", "#F5B301", 20))}</div>
            <div style={{ marginTop: 8 }}><Button variant="navyOutline" pill onClick={onClose}>Done</Button></div>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ---------------- Profile screen ---------------- */
function ProfileScreen() {
  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 26, color: "var(--vm-navy)", margin: "0 0 6px" }}>Profile</h1>
      <p style={{ fontFamily: "var(--font-body)", color: "var(--vm-muted)", margin: "0 0 24px" }}>Your details, homes, and preferences.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Card elevation="raised">
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <Avatar name="Jordan Avery" size="lg" />
              <div><div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 18, color: "var(--vm-navy)" }}>Jordan Avery</div><div style={{ fontSize: 13, color: "var(--vm-muted)", marginTop: 2 }}>Member since 2024 · Newark, NJ</div></div>
              <div style={{ marginLeft: "auto" }}><Badge variant="cyan" icon={sic("star", "var(--vm-cyan-dark)", 13)}>VIP host</Badge></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <FormRow label="Full name"><Input defaultValue="Jordan Avery" /></FormRow>
              <FormRow label="Phone"><Input type="tel" defaultValue="(973) 555-0142" /></FormRow>
              <FormRow label="Email" style={{ gridColumn: "1 / -1" }}><Input type="email" defaultValue="jordan@home.com" /></FormRow>
            </div>
            <div style={{ marginTop: 18, display: "flex", gap: 10 }}><Button variant="navy" size="sm">Save changes</Button><Button variant="ghost" size="sm">Cancel</Button></div>
          </Card>
          <Card elevation="raised">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <CardTitle style={{ fontSize: 16 }}>Saved homes</CardTitle>
              <Button variant="link" iconLeft={sic("plus", "var(--vm-cyan-dark)", 15)}>Add home</Button>
            </div>
            {[["Home", "412 Maple St, Newark NJ 07102", "3 bed · 2 bath", true], ["Rental", "9 Birch Ave, Jersey City NJ", "STR · 2 bed", false]].map(([label, addr, meta, dflt]) => (
              <div key={addr} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderTop: "1px solid var(--border-default)" }}>
                <span style={{ width: 38, height: 38, borderRadius: 10, background: "var(--vm-cyan-tint)", display: "flex", alignItems: "center", justifyContent: "center" }}>{sic("map-pin", "var(--vm-cyan-dark)", 18)}</span>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14, color: "var(--vm-navy)" }}>{label} · <span style={{ fontWeight: 400, color: "var(--vm-muted)" }}>{meta}</span></div><div style={{ fontSize: 13, color: "var(--vm-muted)", marginTop: 2 }}>{addr}</div></div>
                {dflt && <Badge variant="neutral">Primary</Badge>}
              </div>
            ))}
          </Card>
        </div>
        <Card elevation="raised">
          <CardTitle style={{ fontSize: 16, marginBottom: 14 }}>Notifications</CardTitle>
          {[["Booking confirmations", true], ["Specialist on the way (SMS)", true], ["Photo report ready", true], ["Promotions & offers", false]].map(([label, on]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderTop: "1px solid var(--border-default)" }}>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--vm-text)" }}>{label}</span>
              <Switch defaultChecked={on} />
            </div>
          ))}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border-default)" }}>
            <button style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "var(--vm-danger)", fontFamily: "var(--font-body)", fontSize: 14, cursor: "pointer", padding: 0 }}>{sic("log-out", "var(--vm-danger)", 16)} Sign out</button>
          </div>
        </Card>
      </div>
    </div>
  );
}

Object.assign(window, { PaymentBalanceCard, PaymentsScreen, TipFlow, ProfileScreen, FauxQR });
})();
