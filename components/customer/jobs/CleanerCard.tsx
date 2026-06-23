import { User, Star } from 'lucide-react';

interface CleanerCardProps {
  cleaner: {
    id: string;
    name: string;
    averageRating: number | null;
  };
}

export default function CleanerCard({ cleaner }: CleanerCardProps) {
  return (
    <div className="mt-6 pt-6 border-t border-vm-navy/10">
      <h3 className="text-sm font-medium text-vm-text font-body mb-3">Assigned Cleaner</h3>
      <div className="flex items-center gap-3 p-3 bg-vm-surface rounded-lg border border-vm-navy/10">
        <div className="w-12 h-12 bg-vm-cyan/15 rounded-full flex items-center justify-center">
          <User className="w-6 h-6 text-vm-cyan" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-vm-navy font-body">{cleaner.name}</p>
          {cleaner.averageRating !== null ? (
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-4 h-4 text-vm-cyan fill-vm-cyan" />
              <span className="text-sm text-vm-muted font-body">
                {cleaner.averageRating.toFixed(1)} / 5.0
              </span>
            </div>
          ) : (
            <p className="text-sm text-vm-muted font-body">No ratings yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
