"use client";
import { useFinanceSummaryViewModel } from "./useFinanceSummaryViewModel";
import { FinanceSummaryView } from "./FinanceSummaryView";

export default function FinanceSummaryPage() {
  const vm = useFinanceSummaryViewModel();
  return <FinanceSummaryView {...vm} />;
}
