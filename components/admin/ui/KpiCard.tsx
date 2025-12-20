interface KpiCardProps {
  label: string;
  value: string | number;
  highlight?: boolean;
  icon?: React.ReactNode;
}

export default function KpiCard({ label, value, highlight, icon }: KpiCardProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border p-6 ${
        highlight ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-500">{label}</h3>
        {icon && <div className="text-blue-600">{icon}</div>}
      </div>
      <p
        className={`text-3xl font-bold ${
          highlight ? 'text-blue-600' : 'text-gray-900'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

