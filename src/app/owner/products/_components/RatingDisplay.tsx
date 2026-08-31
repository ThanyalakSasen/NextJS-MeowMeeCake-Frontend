import { StarIcon } from "@heroicons/react/24/solid";
/** ดาว + จำนวนรีวิว */
export function RatingDisplay({ rating = 0, count = 0 }: { rating?: number; count?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm text-amber-500">
      <StarIcon className="w-4 h-4" />
      <span className="font-medium">{rating.toFixed(1)}</span>
      <span className="text-gray-400">({count})</span>
    </span>
  );
}
