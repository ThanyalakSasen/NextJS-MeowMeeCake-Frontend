"use client";
import { usePricingViewModel } from "./usePricingViewModel";
import { PricingView } from "./PricingView";

export default function PricingPage() {
  const vm = usePricingViewModel();
  return <PricingView {...vm} />;
}
