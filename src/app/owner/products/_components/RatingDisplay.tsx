import { StarIcon } from "@heroicons/react/24/solid";
/** ดาว + จำนวนรีวิว — ตัวเลขใช้ amber-700 (amber-600 บนพื้นขาวคอนทราสต์ไม่ถึง 4.5:1) */
export function RatingDisplay({ rating = 0, count = 0 }: { rating?: number; count?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm text-amber-700">
      <StarIcon className="w-4 h-4 text-amber-500" aria-hidden />
      <span className="font-semibold">{rating.toFixed(1)}</span>
      <span className="text-gray-600">({count})</span>
    </span>
  );
}
