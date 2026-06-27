'use client';

interface RatingTrendChartProps {
  ratings: number[];
}

export default function RatingTrendChart({ ratings }: RatingTrendChartProps) {
  if (ratings.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-vm-text mb-4">Rating Trend (Last 6 Jobs)</h2>
        <p className="text-vm-muted text-center py-8">No ratings yet</p>
      </div>
    );
  }

  const maxRating = 5;
  const reversedRatings = [...ratings].reverse(); // Most recent first

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-bold text-vm-text mb-4">Rating Trend (Last 6 Jobs)</h2>
      <div className="space-y-3">
        {reversedRatings.map((rating, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-16 text-sm text-vm-muted text-right">
              Job {reversedRatings.length - index}
            </div>
            <div className="flex-1 flex items-center gap-2">
              <div
                className="bg-vm-warning rounded h-6 flex items-center justify-end pr-2"
                style={{ width: `${(rating / maxRating) * 100}%` }}
              >
                {rating > 1 && (
                  <span className="text-white text-xs font-medium">{rating.toFixed(1)}</span>
                )}
              </div>
              <span className="text-sm font-medium text-vm-text w-12">
                {rating.toFixed(1)}/5
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}




