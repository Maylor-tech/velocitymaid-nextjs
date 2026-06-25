interface JobInfoRowProps {
  label: string;
  value: string | number | null | undefined;
}

export default function JobInfoRow({ label, value }: JobInfoRowProps) {
  return (
    <div className="flex justify-between text-sm py-1">
      <span className="text-vm-muted">{label}</span>
      <span className="font-medium text-vm-text text-right max-w-[60%] break-words">
        {value ?? '—'}
      </span>
    </div>
  );
}

