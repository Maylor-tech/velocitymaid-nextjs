Data table for admin/operations lists (jobs, cleaners, payouts). Column `render` lets you drop in StatusBadge, Avatar, or Buttons.

```jsx
<Table
  zebra
  onRowClick={openJob}
  columns={[
    { key: "customer", header: "Customer" },
    { key: "service", header: "Service" },
    { key: "status", header: "Status", render: (v) => <StatusBadge status={v} /> },
    { key: "total", header: "Total", align: "right" },
  ]}
  rows={jobs}
/>
```

Uppercase Space Grotesk headers, hairline row dividers, optional `zebra` striping, cyan-tint hover when `onRowClick` is set.
