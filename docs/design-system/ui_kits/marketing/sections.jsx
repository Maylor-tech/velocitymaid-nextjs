/* VelocityMaid — Marketing website sections (UI kit).
 * Composes design-system primitives from the bundle namespace. */
const VM = window.VelocityMaidDesignSystem_2d9dc2;
const { Button, BrandLogo, Card, CardTitle, CardDescription, Badge } = VM;

const I = (name, color = "var(--vm-navy)", size = 20) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={name==="star"?color:"none"} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,display:"inline-block",verticalAlign:"middle"}} dangerouslySetInnerHTML={{__html:(window.VM_ICON_PATHS&&window.VM_ICON_PATHS[name])||""}} />
);

function MarketingHeader({ onBook }) {
  const links = ["Services", "Why Us", "Reviews", "Pricing", "FAQ"];
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 50, background: "var(--vm-navy)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
      <div style={{ maxWidth: "var(--container-marketing)", margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
        <BrandLogo theme="dark" iconSize={28} showTagline={false} />
        <nav style={{ display: "flex", alignItems: "center", gap: 26 }}>
          {links.map((l) => (
            <a key={l} href="#" style={{ color: "var(--vm-white)", fontFamily: "var(--font-body)", fontSize: 14, textDecoration: "none" }}
               onMouseEnter={(e) => e.target.style.color = "var(--vm-cyan)"} onMouseLeave={(e) => e.target.style.color = "var(--vm-white)"}>{l}</a>
          ))}
          <a href="#" style={{ color: "rgba(255,255,255,0.85)", fontFamily: "var(--font-body)", fontSize: 14 }}>Customer Portal</a>
          <Button variant="cyan" size="sm" onClick={onBook}>Book Now</Button>
        </nav>
      </div>
    </header>
  );
}

function MarketingHero({ onBook }) {
  return (
    <section style={{ background: "linear-gradient(180deg, var(--vm-navy) 0%, #13243b 100%)", color: "var(--vm-white)" }}>
      <div style={{ maxWidth: "var(--container-marketing)", margin: "0 auto", padding: "84px 24px", display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 56, alignItems: "center" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,194,203,0.12)", border: "1px solid rgba(0,194,203,0.3)", borderRadius: "var(--radius-pill)", padding: "6px 14px", marginBottom: 22 }}>
            {I("star", "var(--vm-cyan)", 15)}
            <span style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, color: "var(--vm-cyan)" }}>100+ five-star cleans across NJ &amp; Vermont</span>
          </div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 56, lineHeight: 1.05, letterSpacing: "-0.02em", margin: 0, color: "var(--vm-white)" }}>
            Come home<br/>to clean.
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 19, lineHeight: 1.6, color: "rgba(255,255,255,0.75)", maxWidth: 460, marginTop: 22 }}>
            Premium residential cleaning and short-term rental turnovers — with hospitality-level attention to every detail.
          </p>
          <div style={{ display: "flex", gap: 14, marginTop: 32 }}>
            <Button variant="cyan" size="lg" pill iconRight={I("arrow-right", "var(--vm-navy)", 18)} onClick={onBook}>Book a clean</Button>
            <Button variant="navyOutline" size="lg" pill style={{ color: "var(--vm-white)", borderColor: "rgba(255,255,255,0.3)" }}>See pricing</Button>
          </div>
          <div style={{ display: "flex", gap: 28, marginTop: 40 }}>
            {[["Insured & vetted", "shield-check"], ["Photo reports", "camera"], ["Eco-friendly", "leaf"]].map(([t, ic]) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 8 }}>{I(ic, "var(--vm-cyan)", 18)}<span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "rgba(255,255,255,0.8)" }}>{t}</span></div>
            ))}
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <div style={{ background: "var(--vm-white)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-lg)", padding: 26 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 17, color: "var(--vm-navy)" }}>Next available</span>
              <Badge variant="success">3 slots today</Badge>
            </div>
            {[["Tomorrow · 9:00 AM", "Deep clean · 3 bed", "$220"], ["Thu · 1:00 PM", "Turnover · STR", "$225"], ["Fri · 10:30 AM", "Standard · 2 bed", "$120"]].map(([d, s, p], i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderTop: i ? "1px solid var(--border-default)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 38, height: 38, borderRadius: 10, background: "var(--vm-cyan-tint)", display: "flex", alignItems: "center", justifyContent: "center" }}>{I("calendar", "var(--vm-cyan-dark)", 18)}</span>
                  <div><div style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14, color: "var(--vm-navy)" }}>{d}</div><div style={{ fontSize: 12.5, color: "var(--vm-muted)" }}>{s}</div></div>
                </div>
                <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, color: "var(--vm-navy)" }}>{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ServicesStrip() {
  const items = [
    ["sparkles", "Standard cleaning", "Regular maintenance that keeps every room guest-ready."],
    ["home", "Deep clean", "Top-to-bottom reset — ovens, baseboards, and the details."],
    ["truck", "Move in / out", "Deposit-ready finish for an empty home."],
    ["bed-double", "STR turnovers", "Between-guest resets with a photo report every time."],
  ];
  return (
    <section style={{ background: "var(--vm-white)", padding: "80px 24px" }}>
      <div style={{ maxWidth: "var(--container-marketing)", margin: "0 auto" }}>
        <p className="vm-eyebrow" style={{ color: "var(--vm-cyan-dark)", textAlign: "center" }}>What we do</p>
        <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 38, color: "var(--vm-navy)", textAlign: "center", margin: "8px 0 0" }}>Services for every home</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 22, marginTop: 44 }}>
          {items.map(([ic, t, d]) => (
            <Card key={t} elevation="raised" interactive>
              <span style={{ width: 46, height: 46, borderRadius: 12, background: "var(--vm-cyan-tint)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>{I(ic, "var(--vm-cyan-dark)", 22)}</span>
              <CardTitle>{t}</CardTitle>
              <CardDescription>{d}</CardDescription>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection({ onBook }) {
  const [market, setMarket] = React.useState("nj");
  const nj = [
    { name: "Basic clean", price: "$120", per: "per service", desc: "Perfect for regular maintenance", features: ["Kitchen cleaning", "Bathroom cleaning", "Dusting & vacuuming", "Floor mopping"], highlight: false },
    { name: "Deep clean", price: "$220", per: "per service", desc: "Thorough top-to-bottom clean", features: ["Everything in Basic", "Inside oven & fridge", "Cabinet fronts", "Baseboards & edges"], highlight: true },
    { name: "Move-in / out", price: "$320", per: "per service", desc: "Full property reset", features: ["Everything in Deep", "Inside all cabinets", "Walls spot-cleaned", "Deposit-ready finish"], highlight: false },
  ];
  const vt = [
    { name: "Turnover clean", price: "$225", per: "per turn", desc: "Between-guest reset for STRs", features: ["Full kitchen reset", "All bathrooms cleaned", "Beds stripped & remade", "Photo report included"], highlight: false },
    { name: "Large property", price: "$275", per: "per turn", desc: "4+ bed homes & extended area", features: ["Everything in Turnover", "Travel premium included", "Linen change add-on", "Priority scheduling"], highlight: true },
    { name: "Deep clean", price: "$375", per: "per visit", desc: "First visit or post-season reset", features: ["Full-day service", "Inside oven & fridge", "Baseboards & sills", "Detailed photo report"], highlight: false },
  ];
  const plans = market === "nj" ? nj : vt;
  return (
    <section style={{ background: "var(--vm-surface)", padding: "80px 24px" }}>
      <div style={{ maxWidth: "var(--container-marketing)", margin: "0 auto" }}>
        <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 38, color: "var(--vm-navy)", textAlign: "center", margin: 0 }}>Transparent pricing</h2>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 19, color: "var(--vm-muted)", textAlign: "center", marginTop: 10 }}>No hidden fees, just clean homes</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, margin: "30px 0 40px" }}>
          {[["nj", "New Jersey"], ["vermont", "Vermont"]].map(([k, l]) => (
            <button key={k} onClick={() => setMarket(k)} style={{ padding: "9px 22px", borderRadius: "var(--radius-md)", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 14, cursor: "pointer", border: market === k ? "1px solid var(--vm-navy)" : "1px solid var(--border-default)", background: market === k ? "var(--vm-navy)" : "var(--vm-white)", color: market === k ? "var(--vm-white)" : "var(--vm-muted)" }}>{l}</button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24, alignItems: "start" }}>
          {plans.map((p) => (
            <Card key={p.name} elevation="feature" highlight={p.highlight} style={{ position: "relative" }}>
              {p.highlight && <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)" }}><Badge variant="navy">Most Popular</Badge></div>}
              <CardTitle style={{ fontSize: 22 }}>{p.name}</CardTitle>
              <div style={{ margin: "8px 0 4px" }}><span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 38, color: "var(--vm-cyan-dark)" }}>{p.price}</span><span style={{ color: "var(--vm-muted)" }}> {p.per}</span></div>
              <CardDescription style={{ marginBottom: 18 }}>{p.desc}</CardDescription>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 22px", display: "flex", flexDirection: "column", gap: 11 }}>
                {p.features.map((f) => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "var(--font-body)", fontSize: 14, color: "var(--vm-text)" }}>{I("check", "var(--vm-cyan-dark)", 17)}{f}</li>
                ))}
              </ul>
              <Button variant={p.highlight ? "navy" : "navyOutline"} pill fullWidth onClick={onBook}>Book Now</Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const data = [
    { name: "Sarah M.", location: "Newark, NJ", text: "VelocityMaid transformed our home! The team was professional, thorough, and left everything spotless." },
    { name: "Michael R.", location: "Jersey City, NJ", text: "As an Airbnb host, I need reliable turnovers. VelocityMaid never disappoints — my guests always notice." },
    { name: "Jennifer L.", location: "Newark, NJ", text: "Best cleaning service I've used. They pay attention to every detail and use eco-friendly products." },
  ];
  return (
    <section style={{ background: "var(--vm-white)", padding: "80px 24px" }}>
      <div style={{ maxWidth: "var(--container-marketing)", margin: "0 auto" }}>
        <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 38, color: "var(--vm-navy)", textAlign: "center", margin: 0 }}>What our customers say</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24, marginTop: 44 }}>
          {data.map((t) => (
            <Card key={t.name} elevation="raised">
              <div style={{ display: "flex", gap: 3, marginBottom: 14 }}>{[0,1,2,3,4].map(i => I("star", "#F5B301", 18))}</div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 15, lineHeight: 1.65, color: "var(--vm-text)", margin: "0 0 18px" }}>"{t.text}"</p>
              <div style={{ borderTop: "1px solid var(--border-default)", paddingTop: 14 }}>
                <div style={{ fontFamily: "var(--font-body)", fontWeight: 600, color: "var(--vm-navy)" }}>{t.name}</div>
                <div style={{ fontSize: 13, color: "var(--vm-muted)" }}>{t.location}</div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBand({ onBook }) {
  return (
    <section style={{ background: "var(--vm-navy)", padding: "64px 24px" }}>
      <div style={{ maxWidth: 820, margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 38, color: "var(--vm-white)", margin: 0 }}>Ready for a spotless home?</h2>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 18, color: "rgba(255,255,255,0.7)", marginTop: 14 }}>Book online in under two minutes. We handle the rest.</p>
        <div style={{ marginTop: 28 }}><Button variant="cyan" size="lg" pill onClick={onBook}>Book a clean</Button></div>
      </div>
    </section>
  );
}

function MarketingFooter() {
  return (
    <footer style={{ background: "var(--vm-navy)", borderTop: "1px solid rgba(0,194,203,0.1)" }}>
      <div style={{ maxWidth: "var(--container-marketing)", margin: "0 auto", padding: "48px 24px", display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: 32 }}>
        <div>
          <BrandLogo theme="dark" iconSize={24} showTagline={false} />
          <p style={{ fontFamily: "var(--font-heading)", textTransform: "uppercase", letterSpacing: "0.2em", fontSize: 11, color: "var(--vm-cyan)", marginTop: 12 }}>Come home to clean.</p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 12, lineHeight: 1.6 }}>Serving New Jersey and Vermont. Trusted since 2024.</p>
        </div>
        {[["Resources", ["Partners", "Investor Materials", "Pricing"]], ["Contact", ["New Jersey — (973) 280-9190", "Vermont — (802) 733-5348", "hello@velocitymaid.com"]]].map(([h, items]) => (
          <div key={h}>
            <h4 style={{ fontFamily: "var(--font-heading)", textTransform: "uppercase", letterSpacing: "0.16em", fontSize: 12, color: "rgba(255,255,255,0.5)", margin: "0 0 14px" }}>{h}</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 9 }}>
              {items.map((it) => <li key={it}><a href="#" style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>{it}</a></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ borderTop: "1px solid rgba(0,194,203,0.1)", padding: "22px", textAlign: "center", fontFamily: "var(--font-body)", fontSize: 13, color: "rgba(255,255,255,0.35)" }}>© 2026 VelocityMaid. All rights reserved.</div>
    </footer>
  );
}

Object.assign(window, { MarketingHeader, MarketingHero, ServicesStrip, PricingSection, Testimonials, CtaBand, MarketingFooter });
