/* VelocityMaid — Admin / Operations dashboard (UI kit). */
const VM = window.VelocityMaidDesignSystem_2d9dc2;
const { Button, BrandLogo, Card, CardTitle, KpiCard, Table, StatusBadge, Avatar, Badge, Tabs } = VM;

const ic = (name, color, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={name==="star"?color:"none"} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,display:"inline-block",verticalAlign:"middle"}} dangerouslySetInnerHTML={{__html:(window.VM_ICON_PATHS&&window.VM_ICON_PATHS[name])||""}} />
);

const NAV = [["layout-dashboard", "Dashboard", true], ["calendar", "Jobs", false], ["users", "Cleaners", false], ["map-pin", "Branches", false], ["dollar-sign", "Finance", false], ["settings", "Settings", false]];

const JOBS = [
  { id: "VM-2041", customer: "Sarah Mitchell", service: "Deep clean", cleaner: "Mike Rivera", branch: "Newark, NJ", status: "scheduled", total: "$220" },
  { id: "VM-2052", customer: "James Okonkwo", service: "STR turnover", cleaner: "Ana Lopez", branch: "Ludlow, VT", status: "in_progress", total: "$225" },
  { id: "VM-2033", customer: "Priya Shah", service: "Standard clean", cleaner: "Devon King", branch: "Jersey City, NJ", status: "assigned", total: "$120" },
  { id: "VM-2018", customer: "Marcus Bell", service: "Move-out clean", cleaner: "Unassigned", branch: "Newark, NJ", status: "pending", total: "$320" },
  { id: "VM-1990", customer: "Elena Torres", service: "Deep clean", cleaner: "Mike Rivera", branch: "Middlebury, VT", status: "completed", total: "$220" },
];

function Sidebar() {
  return (
    <aside style={{ width: 232, background: "var(--vm-navy)", minHeight: "100vh", padding: "20px 14px", flexShrink: 0 }}>
      <div style={{ padding: "6px 10px 22px" }}><BrandLogo theme="dark" iconSize={24} showTagline={false} /></div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {NAV.map(([icon, label, active]) => (
          <a key={label} href="#" style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", borderRadius: "var(--radius-sm)", textDecoration: "none", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: active ? 600 : 500, color: active ? "var(--vm-navy)" : "rgba(255,255,255,0.7)", background: active ? "var(--vm-cyan)" : "transparent" }}>
            {ic(icon, active ? "var(--vm-navy)" : "rgba(255,255,255,0.7)", 18)}{label}
          </a>
        ))}
      </nav>
      <div style={{ marginTop: 28, padding: "14px", background: "rgba(255,255,255,0.06)", borderRadius: "var(--radius-md)" }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "rgba(255,255,255,0.7)", margin: 0, lineHeight: 1.5 }}>3 jobs need a specialist assigned.</p>
        <a href="#" style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--vm-cyan)", fontWeight: 600 }}>Assign now →</a>
      </div>
    </aside>
  );
}

function AdminApp() {
  const [tab, setTab] = React.useState("all");
  const rows = tab === "all" ? JOBS : JOBS.filter((j) => tab === "needs" ? (j.cleaner === "Unassigned") : j.status === tab);
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--vm-surface)" }}>
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0 }}>
        <header style={{ background: "var(--vm-white)", borderBottom: "1px solid var(--border-default)", padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div><h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 20, color: "var(--vm-navy)", margin: 0 }}>Operations Dashboard</h1><p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--vm-muted)", margin: "3px 0 0" }}>Tuesday, June 24 · NJ &amp; Vermont</p></div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Button variant="navyOutline" size="sm" iconLeft={ic("download", "var(--vm-navy)", 16)}>Export</Button>
            <Button variant="navy" size="sm" iconLeft={ic("plus", "var(--vm-white)", 16)}>New job</Button>
            <Avatar name="Admin User" size="sm" />
          </div>
        </header>
        <div style={{ padding: 28 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginBottom: 26 }}>
            <KpiCard label="Jobs this week" value="128" delta={{ value: "12% vs last", direction: "up" }} icon={ic("calendar", "var(--vm-cyan-dark)", 20)} />
            <KpiCard label="Revenue (wk)" value="$24.6k" delta={{ value: "8% vs last", direction: "up" }} icon={ic("dollar-sign", "var(--vm-cyan-dark)", 20)} />
            <KpiCard label="Active cleaners" value="34" subtitle="6 onboarding" icon={ic("users", "var(--vm-cyan-dark)", 20)} />
            <KpiCard label="Avg. rating" value="4.9" delta={{ value: "0.1 vs last", direction: "up" }} icon={ic("star", "var(--vm-cyan-dark)", 20)} />
          </div>
          <Card elevation="raised" padding="none" style={{ overflow: "hidden" }}>
            <div style={{ padding: "18px 20px 0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <CardTitle style={{ fontSize: 17 }}>Recent jobs</CardTitle>
                <Badge variant="cyan">{JOBS.length} this view</Badge>
              </div>
              <Tabs value={tab} onChange={setTab} tabs={[{ value: "all", label: "All" }, { value: "pending", label: "Pending" }, { value: "in_progress", label: "In progress" }, { value: "needs", label: "Needs assignment" }]} />
            </div>
            <div style={{ padding: 20 }}>
              <Table onRowClick={() => {}} columns={[
                { key: "id", header: "Job" },
                { key: "customer", header: "Customer" },
                { key: "service", header: "Service" },
                { key: "cleaner", header: "Specialist", render: (v) => v === "Unassigned" ? <Badge variant="warning">Unassigned</Badge> : <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Avatar name={v} size="sm" />{v}</span> },
                { key: "branch", header: "Branch" },
                { key: "status", header: "Status", render: (v) => <StatusBadge status={v} /> },
                { key: "total", header: "Total", align: "right" },
              ]} rows={rows} getRowKey={(r) => r.id} />
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

Object.assign(window, { AdminApp });
