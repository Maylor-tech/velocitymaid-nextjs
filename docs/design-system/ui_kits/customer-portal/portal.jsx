/* VelocityMaid — Customer Portal shell + bookings + job detail (UI kit). */
(function(){
const VM = window.VelocityMaidDesignSystem_2d9dc2;
const { Button, BrandLogo, Card, CardTitle, Badge, StatusBadge, Avatar, Tabs, Alert } = VM;
const { PaymentBalanceCard, PaymentsScreen, TipFlow, ProfileScreen } = window;

const ic = (name, color, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={name === "star" ? color : "none"} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: "inline-block", verticalAlign: "middle" }} dangerouslySetInnerHTML={{ __html: (window.VM_ICON_PATHS && window.VM_ICON_PATHS[name]) || "" }} />
);

const JOBS = {
  upcoming: [
    { id: "VM-2041", service: "Deep clean", date: "Thu, Jun 26 · 9:00 AM", cleaner: "Mike Rivera", status: "scheduled", total: "$220", balance: "$220.00", address: "412 Maple St, Newark NJ", lines: [["Deep clean · 3 bed", "$200.00"], ["Inside oven & fridge", "$20.00"]] },
    { id: "VM-2052", service: "Standard clean", date: "Mon, Jun 30 · 1:00 PM", cleaner: "Ana Lopez", status: "assigned", total: "$120", balance: "$120.00", address: "412 Maple St, Newark NJ", lines: [["Standard clean · 3 bed", "$120.00"]] },
  ],
  past: [
    { id: "VM-1990", service: "Deep clean", date: "Jun 12 · 9:00 AM", cleaner: "Mike Rivera", status: "completed", total: "$220", paid: true, tipped: false, address: "412 Maple St, Newark NJ", lines: [["Deep clean · 3 bed", "$220.00"]] },
    { id: "VM-1944", service: "Standard clean", date: "Jun 5 · 10:30 AM", cleaner: "Devon King", status: "completed", total: "$120", paid: true, tipped: true, address: "412 Maple St, Newark NJ", lines: [["Standard clean · 3 bed", "$120.00"]] },
    { id: "VM-1900", service: "Move-out clean", date: "May 28 · 9:00 AM", cleaner: "Ana Lopez", status: "cancelled", total: "$320", paid: false, address: "9 Birch Ave, Jersey City NJ", lines: [["Move-out clean", "$320.00"]] },
  ],
};

function JobRow({ job, onClick }) {
  const balanceDue = (job.status === "scheduled" || job.status === "assigned");
  const canTip = job.status === "completed" && !job.tipped;
  return (
    <button onClick={() => onClick(job)} style={{ width: "100%", textAlign: "left", cursor: "pointer", background: "var(--vm-white)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", padding: 18, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, transition: "box-shadow 150ms, transform 150ms" }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ width: 44, height: 44, borderRadius: 12, background: "var(--vm-cyan-tint)", display: "flex", alignItems: "center", justifyContent: "center" }}>{ic("home", "var(--vm-cyan-dark)", 22)}</span>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}><span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, color: "var(--vm-navy)", fontSize: 16 }}>{job.service}</span><StatusBadge status={job.status} />{job.tipped && <Badge variant="cyan" icon={ic("star", "var(--vm-cyan-dark)", 12)}>Tipped</Badge>}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5, fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--vm-muted)" }}>{ic("calendar", "var(--vm-muted)", 14)}{job.date}<span style={{ color: "var(--border-default)" }}>·</span>{job.cleaner}</div>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, color: "var(--vm-navy)" }}>{job.total}</div>
        {balanceDue ? <div style={{ fontSize: 12, color: "var(--vm-warning)", fontWeight: 600, marginTop: 4 }}>Balance due</div>
          : canTip ? <div style={{ fontSize: 12, color: "var(--vm-cyan-dark)", fontWeight: 600, marginTop: 4 }}>Leave a tip →</div>
          : <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--vm-muted)", marginTop: 4 }}>{job.id}</div>}
      </div>
    </button>
  );
}

function JobDetail({ job, onBack, onTip }) {
  const upcoming = (job.status === "scheduled" || job.status === "assigned");
  return (
    <div>
      <button onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--vm-muted)", fontFamily: "var(--font-body)", fontSize: 14, padding: 0, marginBottom: 18 }}>{ic("arrow-left", "var(--vm-muted)", 16)} Back to bookings</button>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div><h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 26, color: "var(--vm-navy)", margin: 0 }}>{job.service}</h1><p style={{ fontFamily: "var(--font-body)", color: "var(--vm-muted)", margin: "6px 0 0" }}>{job.id} · {job.date}</p></div>
        <StatusBadge status={job.status} icon={ic("clock", "currentColor", 14)} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card elevation="raised">
            <CardTitle style={{ fontSize: 16, marginBottom: 14 }}>Service details</CardTitle>
            {[["Address", job.address], ["Arrival window", job.date], ["Plan", job.service], ["Booking", job.id]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border-default)", fontFamily: "var(--font-body)", fontSize: 14 }}><span style={{ color: "var(--vm-muted)" }}>{k}</span><span style={{ color: "var(--vm-navy)", fontWeight: 500 }}>{v}</span></div>
            ))}
            {job.status === "completed" && <div style={{ marginTop: 16 }}><Alert variant="success" icon={ic("camera", "currentColor", 16)}>Photo report available — 14 photos from your clean.</Alert></div>}
          </Card>
          {job.status === "completed" && !job.tipped && (
            <Card elevation="raised" style={{ background: "linear-gradient(180deg, var(--vm-cyan-tint), var(--vm-white))" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Avatar name={job.cleaner} size="lg" />
                <div style={{ flex: 1 }}><div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, color: "var(--vm-navy)" }}>Loved your clean?</div><div style={{ fontSize: 13.5, color: "var(--vm-muted)", marginTop: 2 }}>Send {job.cleaner.split(" ")[0]} a thank-you tip — 100% goes to them.</div></div>
                <Button variant="cyan" pill onClick={() => onTip(job)}>Leave a tip</Button>
              </div>
            </Card>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card elevation="raised">
            <CardTitle style={{ fontSize: 16, marginBottom: 14 }}>Your specialist</CardTitle>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar name={job.cleaner} size="lg" />
              <div><div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, color: "var(--vm-navy)" }}>{job.cleaner}</div><div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--vm-muted)", marginTop: 3 }}>{ic("star", "#F5B301", 14)} 4.9 · 240 cleans</div></div>
            </div>
          </Card>
          <PaymentBalanceCard job={job} paid={job.paid} onPay={() => {}} />
          {upcoming && (
            <Card elevation="raised" padding="md">
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Button variant="navy" fullWidth>Reschedule</Button>
                <Button variant="ghost" fullWidth>Cancel booking</Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function BookingsScreen({ onSelect }) {
  const [tab, setTab] = React.useState("upcoming");
  const list = JOBS[tab];
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 8 }}>
        <div><h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 28, color: "var(--vm-navy)", margin: 0 }}>Welcome back, Jordan</h1><p style={{ fontFamily: "var(--font-body)", color: "var(--vm-muted)", margin: "6px 0 0" }}>Manage your bookings and rebook in a tap.</p></div>
        <Button variant="cyan" pill iconRight={ic("plus", "var(--vm-navy)", 16)}>New booking</Button>
      </div>
      <div style={{ margin: "24px 0 22px" }}>
        <Tabs value={tab} onChange={setTab} tabs={[{ value: "upcoming", label: "Upcoming", count: JOBS.upcoming.length }, { value: "past", label: "Past", count: JOBS.past.length }]} />
      </div>
      {list.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{list.map((j) => <JobRow key={j.id} job={j} onClick={onSelect} />)}</div>
      ) : (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <span style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--vm-surface)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>{ic("calendar", "var(--vm-muted)", 26)}</span>
          <h3 style={{ fontFamily: "var(--font-heading)", color: "var(--vm-navy)", margin: 0 }}>No bookings yet</h3>
          <p style={{ color: "var(--vm-muted)", margin: "6px 0 0" }}>Book your first clean to see it here.</p>
        </div>
      )}
    </div>
  );
}

function PortalApp() {
  const [section, setSection] = React.useState("bookings");
  const [selected, setSelected] = React.useState(null);
  const [tipJob, setTipJob] = React.useState(null);
  const nav = [["bookings", "Bookings"], ["payments", "Payments"], ["profile", "Profile"]];
  const go = (s) => { setSection(s); setSelected(null); };

  return (
    <div style={{ minHeight: "100vh", background: "var(--vm-surface)" }}>
      <header style={{ background: "var(--vm-navy)", padding: "0 24px" }}>
        <div style={{ maxWidth: 980, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            <BrandLogo theme="dark" iconSize={26} showTagline={false} />
            <nav style={{ display: "flex", gap: 4 }}>
              {nav.map(([k, label]) => (
                <button key={k} onClick={() => go(k)} style={{ background: "none", border: "none", cursor: "pointer", padding: "8px 14px", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: section === k ? 600 : 500, color: section === k ? "var(--vm-cyan)" : "rgba(255,255,255,0.75)" }}>{label}</button>
              ))}
            </nav>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ position: "relative", display: "inline-flex" }}>{ic("bell", "rgba(255,255,255,0.8)", 20)}<span style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: "50%", background: "var(--vm-cyan)" }} /></span>
            <Avatar name="Jordan Avery" size="sm" />
          </div>
        </div>
      </header>
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "36px 24px" }}>
        {tipJob ? <TipFlow cleaner={tipJob.cleaner} onClose={() => setTipJob(null)} />
          : section === "bookings" ? (selected ? <JobDetail job={selected} onBack={() => setSelected(null)} onTip={setTipJob} /> : <BookingsScreen onSelect={setSelected} />)
          : section === "payments" ? <PaymentsScreen />
          : <ProfileScreen />}
      </div>
    </div>
  );
}

Object.assign(window, { PortalApp });
})();
