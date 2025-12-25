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
    <div className="mt-6 pt-6 border-t border-gray-200">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Assigned Cleaner</h3>
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <User className="w-6 h-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-gray-900">{cleaner.name}</p>
          {cleaner.averageRating !== null ? (
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-sm text-gray-600">
                {cleaner.averageRating.toFixed(1)} / 5.0
              </span>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No ratings yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
















