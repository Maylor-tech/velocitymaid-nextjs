/* VelocityMaid — Mobile app (UI kit). 390px design width, multi-screen. */
const VM = window.VelocityMaidDesignSystem_2d9dc2;
const { Button, BrandLogo, StatusBadge, Avatar, Badge, Input, FormRow, Switch } = VM;

const ic = (name, color, size = 22) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={name === "star" ? color : "none"} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: "inline-block", verticalAlign: "middle" }} dangerouslySetInnerHTML={{ __html: (window.VM_ICON_PATHS && window.VM_ICON_PATHS[name]) || "" }} />
);

const UPCOMING = [
  { service: "Deep clean", date: "Thu, Jun 26 · 9:00 AM", cleaner: "Mike Rivera", status: "scheduled" },
  { service: "Standard clean", date: "Mon, Jun 30 · 1:00 PM", cleaner: "Ana Lopez", status: "assigned" },
];
const PAST = [
  { service: "Standard clean", date: "Jun 5", status: "completed", tip: true },
  { service: "Deep clean", date: "May 22", status: "completed", tip: false },
];

function HomeScreen({ onTip }) {
  return (
    <div style={{ padding: 18 }}>
      <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 22, color: "var(--vm-navy)", margin: "0 0 4px" }}>Hi, Jordan 👋</h1>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--vm-muted)", margin: "0 0 18px" }}>Your home is in good hands.</p>
      <div style={{ background: "var(--vm-navy)", borderRadius: "var(--radius-xl)", padding: 20, color: "var(--vm-white)", marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontFamily: "var(--font-heading)", textTransform: "uppercase", letterSpacing: "0.16em", fontSize: 11, color: "var(--vm-cyan)" }}>Next clean</span>
          <Badge variant="cyanSolid">In 2 days</Badge>
        </div>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 20 }}>Deep clean</div>
        <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>Thu, Jun 26 · 9:00 AM</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.12)" }}>
          <Avatar name="Mike Rivera" size="sm" />
          <div style={{ flex: 1 }}><div style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14 }}>Mike Rivera</div><div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>Your specialist · ★ 4.9</div></div>
          <span style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--vm-cyan)", display: "flex", alignItems: "center", justifyContent: "center" }}>{ic("message-circle", "var(--vm-navy)", 18)}</span>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
        {[["plus", "Book a clean"], ["repeat", "Rebook last"], ["star", "Leave a tip"], ["headphones", "Get help"]].map(([icon, label]) => (
          <button key={label} onClick={label === "Leave a tip" ? onTip : undefined} style={{ textAlign: "left", cursor: "pointer", background: "var(--vm-white)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ width: 38, height: 38, borderRadius: 10, background: "var(--vm-cyan-tint)", display: "flex", alignItems: "center", justifyContent: "center" }}>{ic(icon, "var(--vm-cyan-dark)", 19)}</span>
            <span style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14, color: "var(--vm-navy)" }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function BookingsScreenM({ onTip }) {
  const [seg, setSeg] = React.useState("upcoming");
  const list = seg === "upcoming" ? UPCOMING : PAST;
  return (
    <div style={{ padding: 18 }}>
      <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 22, color: "var(--vm-navy)", margin: "0 0 14px" }}>Bookings</h1>
      <div style={{ display: "flex", background: "var(--vm-surface)", borderRadius: "var(--radius-pill)", padding: 4, marginBottom: 16 }}>
        {[["upcoming", "Upcoming"], ["past", "Past"]].map(([k, l]) => (
          <button key={k} onClick={() => setSeg(k)} style={{ flex: 1, padding: "8px 0", borderRadius: "var(--radius-pill)", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13.5, background: seg === k ? "var(--vm-white)" : "transparent", color: seg === k ? "var(--vm-navy)" : "var(--vm-muted)", boxShadow: seg === k ? "var(--shadow-sm)" : "none" }}>{l}</button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {list.map((j, i) => (
          <div key={i} style={{ background: "var(--vm-white)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 38, height: 38, borderRadius: 10, background: "var(--vm-cyan-tint)", display: "flex", alignItems: "center", justifyContent: "center" }}>{ic("home", "var(--vm-cyan-dark)", 18)}</span>
                <div><div style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14, color: "var(--vm-navy)" }}>{j.service}</div><div style={{ fontSize: 12.5, color: "var(--vm-muted)", marginTop: 2 }}>{j.date}</div></div>
              </div>
              <StatusBadge status={j.status} />
            </div>
            {seg === "past" && j.status === "completed" && !j.tip && (
              <button onClick={onTip} style={{ marginTop: 12, width: "100%", padding: "9px 0", borderRadius: "var(--radius-sm)", border: "1px solid var(--vm-cyan)", background: "var(--vm-cyan-tint)", color: "var(--vm-navy)", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.06em", cursor: "pointer" }}>Leave a tip</button>
            )}
            {j.tip && <div style={{ marginTop: 10 }}><Badge variant="cyan" icon={ic("star", "var(--vm-cyan-dark)", 12)}>Tipped — thank you!</Badge></div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function AccountScreenM() {
  return (
    <div style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <Avatar name="Jordan Avery" size="lg" />
        <div><div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 18, color: "var(--vm-navy)" }}>Jordan Avery</div><div style={{ fontSize: 13, color: "var(--vm-muted)" }}>Newark, NJ · VIP host</div></div>
      </div>
      <FormRow label="Phone" style={{ marginBottom: 14 }}><Input type="tel" defaultValue="(973) 555-0142" /></FormRow>
      <div style={{ background: "var(--vm-white)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", padding: 4, marginBottom: 16 }}>
        {[["Booking confirmations", true], ["Specialist on the way", true], ["Promotions & offers", false]].map(([l, on], i) => (
          <div key={l} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 12px", borderTop: i ? "1px solid var(--border-default)" : "none" }}>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--vm-text)" }}>{l}</span><Switch defaultChecked={on} />
          </div>
        ))}
      </div>
      <Button variant="navyOutline" fullWidth>Manage payment methods</Button>
    </div>
  );
}

function TipSheet({ onClose }) {
  const { TipFlow } = window;
  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(15,28,46,0.5)", display: "flex", alignItems: "flex-end", zIndex: 20 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", background: "var(--vm-surface)", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: "18px 14px 24px", maxHeight: "88%", overflowY: "auto" }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--border-default)", margin: "0 auto 16px" }} />
        {TipFlow ? <TipFlow cleaner="Mike Rivera" onClose={onClose} /> : null}
      </div>
    </div>
  );
}

function MobileScreen() {
  const [tab, setTab] = React.useState("home");
  const [tip, setTip] = React.useState(false);
  const tabs = [["home", "Home"], ["calendar", "Bookings"], ["plus", "Book"], ["message-circle", "Chat"], ["user", "Account"]];
  const openTip = () => setTip(true);
  const body = tab === "calendar" ? <BookingsScreenM onTip={openTip} /> : tab === "user" ? <AccountScreenM /> : <HomeScreen onTip={openTip} />;
  return (
    <div style={{ width: 390, height: 800, background: "var(--vm-surface)", borderRadius: 40, border: "10px solid #0a121d", overflow: "hidden", position: "relative", boxShadow: "var(--shadow-lg)", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "var(--vm-navy)", color: "var(--vm-white)", padding: "10px 22px 0", fontFamily: "var(--font-body)", fontSize: 13, display: "flex", justifyContent: "space-between" }}><span>9:41</span><span>●●● 5G ⏻</span></div>
      <div style={{ background: "var(--vm-navy)", padding: "10px 18px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <BrandLogo theme="dark" iconSize={24} showTagline={false} />
        <span style={{ position: "relative", display: "inline-flex" }}>{ic("bell", "rgba(255,255,255,0.85)", 22)}<span style={{ position: "absolute", top: -1, right: -1, width: 8, height: 8, borderRadius: "50%", background: "var(--vm-cyan)" }} /></span>
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>{body}</div>
      {tip && <TipSheet onClose={() => setTip(false)} />}
      <div style={{ background: "var(--vm-white)", borderTop: "1px solid var(--border-default)", display: "flex", justifyContent: "space-around", padding: "10px 8px 20px" }}>
        {tabs.map(([icon, label]) => {
          const active = tab === icon;
          if (label === "Book") return <button key={label} onClick={() => setTab("home")} style={{ background: "var(--vm-cyan)", border: "none", width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginTop: -16, boxShadow: "var(--shadow-cyan)", cursor: "pointer" }}>{ic("plus", "var(--vm-navy)", 24)}</button>;
          return (
            <button key={label} onClick={() => setTab(icon)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flex: 1 }}>
              {ic(icon, active ? "var(--vm-cyan-dark)" : "var(--vm-muted)", 22)}
              <span style={{ fontFamily: "var(--font-body)", fontSize: 10.5, fontWeight: active ? 600 : 500, color: active ? "var(--vm-navy)" : "var(--vm-muted)" }}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MobileKit() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--vm-surface)", display: "flex", alignItems: "center", justifyContent: "center", padding: 30 }}>
      <MobileScreen />
    </div>
  );
}

Object.assign(window, { MobileKit });
