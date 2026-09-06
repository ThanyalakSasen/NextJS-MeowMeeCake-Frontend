"use client";
import { Suspense } from "react";
import { useProductionViewModel } from "./useProductionViewModel";
import { ProductionView } from "./ProductionView";

// useSearchParams (ใน ViewModel — sync ?tab=) ต้องอยู่ใต้ Suspense boundary
function ProductionInner() {
  const vm = useProductionViewModel();
  return <ProductionView {...vm} />;
}

export default function ProductionPage() {
  return (
    <Suspense>
      <ProductionInner />
    </Suspense>
  );
}
