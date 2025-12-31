type Blocker = {
  code: string;
  label: string;
  message: string;
};

export function PayoutBlockers({ blockers }: { blockers: Blocker[] }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-700">
        Action required
      </h3>

      <ul className="space-y-2">
        {blockers.map((b) => (
          <li
            key={b.code}
            className="rounded-md border bg-gray-50 p-3 text-sm"
          >
            <div className="font-medium">{b.label}</div>
            <div className="text-gray-600">{b.message}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

