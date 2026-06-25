'use client';

type EmptyStateProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function EmptyState({
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <h2 className="text-xl font-semibold text-vm-text">{title}</h2>

      {subtitle && (
        <p className="mt-2 max-w-md text-sm text-vm-muted">
          {subtitle}
        </p>
      )}

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-6 rounded-md bg-vm-navy px-5 py-2 text-sm font-medium text-white hover:bg-vm-navy"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
