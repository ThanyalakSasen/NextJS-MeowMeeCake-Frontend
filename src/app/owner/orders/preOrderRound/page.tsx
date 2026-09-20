"use client";
import { Suspense } from "react";
import { usePreOrderRoundViewModel } from "./usePreOrderRoundViewModel";
import { PreOrderRoundView } from "./PreOrderRoundView";

// useSearchParams (ใน ViewModel — sync ?tab=) ต้องอยู่ใต้ Suspense boundary
function PreOrderRoundInner() {
  const vm = usePreOrderRoundViewModel();
  return <PreOrderRoundView {...vm} />;
}

export default function PreOrderRoundPage() {
  return (
    <Suspense>
      <PreOrderRoundInner />
    </Suspense>
  );
}
