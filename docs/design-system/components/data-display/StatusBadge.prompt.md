Job lifecycle status pill — single source of truth for booking/job states across customer, cleaner, and admin views.

```jsx
<StatusBadge status="scheduled" icon={<Clock size={14} />} />
<StatusBadge status="completed" />
```

Known statuses: `pending, scheduled, assigned, in_progress, completed, cancelled, reschedule_requested, cancel_requested`. Unknown values render the raw string on a neutral chip.
