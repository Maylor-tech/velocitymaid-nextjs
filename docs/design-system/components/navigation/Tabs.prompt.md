Underline tab navigation for portal/admin views and filtered lists.

```jsx
<Tabs
  defaultValue="upcoming"
  onChange={setTab}
  tabs={[
    { value: "upcoming", label: "Upcoming", count: 3 },
    { value: "past", label: "Past" },
  ]}
/>
```

Controlled via `value`/`onChange` or uncontrolled via `defaultValue`. Each tab supports an optional `icon` and `count`.
