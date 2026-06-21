import { ReactNode } from 'react';

interface JobDetailSectionProps {
  icon: ReactNode;
  label: string;
  value: string | ReactNode;
}

export default function JobDetailSection({ icon, label, value }: JobDetailSectionProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-vm-muted mt-0.5">{icon}</div>
      <div>
        <p className="text-sm text-vm-muted font-body mb-1">{label}</p>
        <p className="font-medium text-vm-navy font-body">{value}</p>
      </div>
    </div>
  );
}
