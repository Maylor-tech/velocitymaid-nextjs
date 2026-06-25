import { ReactNode } from 'react';

interface FormRowProps {
  label: string;
  required?: boolean;
  children: ReactNode;
  error?: string;
  helpText?: string;
}

export default function FormRow({ label, required, children, error, helpText }: FormRowProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-vm-text mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helpText && !error && (
        <p className="mt-1 text-xs text-vm-muted">{helpText}</p>
      )}
    </div>
  );
}

















