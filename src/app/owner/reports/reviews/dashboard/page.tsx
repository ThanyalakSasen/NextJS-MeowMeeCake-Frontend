"use client";
import { useReviewDashboardViewModel } from "./useReviewDashboardViewModel";
import { ReviewDashboardView } from "./ReviewDashboardView";

export default function ReviewDashboardPage() {
  const vm = useReviewDashboardViewModel();
  return <ReviewDashboardView {...vm} />;
}
