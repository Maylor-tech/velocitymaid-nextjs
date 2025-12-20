'use client';

export type DateRange = 'today' | 'week' | 'month';

interface RangeSelectorProps {
  selectedRange: DateRange;
  onRangeChange: (range: DateRange) => void;
}

export default function RangeSelector({ selectedRange, onRangeChange }: RangeSelectorProps) {
  const ranges: { id: DateRange; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
  ];

  return (
    <div className="flex gap-2 mb-6">
      {ranges.map((range) => (
        <button
          key={range.id}
          onClick={() => onRangeChange(range.id)}
          className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
            selectedRange === range.id
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}




