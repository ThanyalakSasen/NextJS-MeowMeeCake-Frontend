"use client";
import { useCouponsViewModel } from "./useCouponsViewModel";
import { CouponsView } from "./CouponsView";

export default function CouponsPage() {
  const vm = useCouponsViewModel();
  return <CouponsView {...vm} />;
}
