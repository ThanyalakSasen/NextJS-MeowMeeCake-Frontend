"use client";
import { useReviewsViewModel } from "./useReviewsViewModel";
import { ReviewsView } from "./ReviewsView";

export default function ReviewsPage() {
  const vm = useReviewsViewModel();
  return <ReviewsView {...vm} />;
}
