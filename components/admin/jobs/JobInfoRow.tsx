interface JobInfoRowProps {
  label: string;
  value: string | number | null | undefined;
}

export default function JobInfoRow({ label, value }: JobInfoRowProps) {
  return (
    <div className="flex justify-between text-sm py-1">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800 text-right max-w-[60%] break-words">
        {value ?? '—'}
      </span>
    </div>
  );
}

