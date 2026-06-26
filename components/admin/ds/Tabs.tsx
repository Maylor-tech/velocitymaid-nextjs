'use client';

export interface TabItem {
  value: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function Tabs({ tabs, value, onChange, className = '' }: TabsProps) {
  return (
    <div className={`flex gap-1 border-b border-vm-border ${className}`}>
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={`mb-[-1px] inline-flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 font-body text-sm transition-colors ${
              active
                ? 'border-vm-cyan font-semibold text-vm-navy'
                : 'border-transparent font-medium text-vm-muted hover:text-vm-navy'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                  active
                    ? 'bg-vm-cyan-tint text-vm-navy'
                    : 'bg-vm-surface text-vm-muted'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
