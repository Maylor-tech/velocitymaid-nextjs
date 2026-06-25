type Blocker = {
  code: string;
  label: string;
  message: string;
};

export function PayoutBlockers({ blockers }: { blockers: Blocker[] }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-vm-text">
        Action required
      </h3>

      <ul className="space-y-2">
        {blockers.map((b) => (
          <li
            key={b.code}
            className="rounded-md border bg-vm-surface p-3 text-sm"
          >
            <div className="font-medium">{b.label}</div>
            <div className="text-vm-muted">{b.message}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

