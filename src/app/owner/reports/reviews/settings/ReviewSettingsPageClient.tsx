"use client";
import { useReviewSettingsViewModel } from "./useReviewSettingsViewModel";
import { ReviewSettingsView } from "./ReviewSettingsView";

export default function ReviewSettingsPage() {
  const vm = useReviewSettingsViewModel();
  return <ReviewSettingsView {...vm} />;
}
