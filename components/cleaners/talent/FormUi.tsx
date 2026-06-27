import { ReactNode } from 'react';

export const inputClass =
  'w-full rounded-lg border border-vm-border bg-vm-white px-4 py-3 font-body text-sm text-vm-text transition-colors focus:border-vm-cyan focus:outline-none focus:ring-1 focus:ring-vm-cyan';
export const labelClass = 'mb-1.5 block font-heading text-sm font-semibold text-vm-navy';
export const helperClass = 'mt-1 font-body text-xs text-vm-muted';

export function SectionCard({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 rounded-2xl border border-vm-border bg-vm-white p-6 shadow-sm sm:p-8">
      <div className="mb-6 border-b border-vm-border pb-4">
        <h2 className="font-heading text-xl font-bold text-vm-navy">{title}</h2>
        {description && (
          <p className="mt-1 font-body text-sm text-vm-muted">{description}</p>
        )}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export function FieldGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>;
}

export function YesNoField({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  required?: boolean;
}) {
  return (
    <fieldset>
      <legend className={`${labelClass} mb-2`}>
        {label}
        {required && ' *'}
      </legend>
      <div className="flex flex-wrap gap-3">
        {[
          { v: true, l: 'Yes' },
          { v: false, l: 'No' },
        ].map((opt) => (
          <button
            key={opt.l}
            type="button"
            onClick={() => onChange(opt.v)}
            className={`rounded-lg border px-4 py-2 font-body text-sm transition-colors ${
              value === opt.v
                ? 'border-vm-navy bg-vm-navy text-vm-white'
                : 'border-vm-border bg-vm-white text-vm-text hover:border-vm-cyan'
            }`}
          >
            {opt.l}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function CheckboxGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onToggle: (item: string) => void;
}) {
  return (
    <div>
      <p className={`${labelClass} mb-2`}>{label}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((item) => (
          <label
            key={item}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-vm-border px-3 py-2.5 font-body text-sm text-vm-text hover:border-vm-cyan/50"
          >
            <input
              type="checkbox"
              checked={selected.includes(item)}
              onChange={() => onToggle(item)}
              className="h-4 w-4 rounded border-vm-border text-vm-cyan focus:ring-vm-cyan"
            />
            {item}
          </label>
        ))}
      </div>
    </div>
  );
}

export function RatingRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-vm-border py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="font-body text-sm text-vm-navy">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`${label}: ${n} of 5`}
            className={`h-9 w-9 rounded-md font-heading text-sm font-bold transition-colors ${
              value >= n
                ? 'bg-vm-cyan text-vm-navy'
                : 'bg-vm-surface text-vm-muted hover:bg-vm-cyan-tint'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
