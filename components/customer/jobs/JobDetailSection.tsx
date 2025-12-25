import { ReactNode } from 'react';

interface JobDetailSectionProps {
  icon: ReactNode;
  label: string;
  value: string | ReactNode;
}

export default function JobDetailSection({ icon, label, value }: JobDetailSectionProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-gray-400 mt-0.5">{icon}</div>
      <div>
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <p className="font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}















