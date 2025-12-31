type Props = {
  completedJobs: number;
  minimumJobs: number;
  eligibleAmountCents: number;
};

export function PayoutProgress({
  completedJobs,
  minimumJobs,
  eligibleAmountCents,
}: Props) {
  const progress = Math.min(
    100,
    Math.round((completedJobs / minimumJobs) * 100)
  );

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-gray-600">
        <span>
          Jobs completed: {completedJobs} / {minimumJobs}
        </span>
        <span>
          Eligible earnings: $
          {(eligibleAmountCents / 100).toFixed(2)}
        </span>
      </div>

      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-600 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

