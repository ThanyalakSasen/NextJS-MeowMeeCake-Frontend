"use client";
// ดาว 1-5 ของรีวิว 1 รายการ — ต่างจาก products/_components/RatingDisplay.tsx ที่โชว์ "ค่าเฉลี่ย (จำนวนรีวิว)"
// ของสินค้าทั้งหมด อันนี้โชว์คะแนนดิบของรีวิวใบเดียวเป็นดวงดาว
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import { StarIcon as StarOutline } from "@heroicons/react/24/outline";

export function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating}/5`}>
      {[1, 2, 3, 4, 5].map((n) =>
        n <= rating ? (
          <StarSolid key={n} className="h-4 w-4 text-amber-500" />
        ) : (
          <StarOutline key={n} className="h-4 w-4 text-gray-300" />
        ),
      )}
    </span>
  );
}
