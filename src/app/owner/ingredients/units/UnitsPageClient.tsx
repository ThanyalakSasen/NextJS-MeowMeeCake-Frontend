"use client";
import { useUnitsViewModel } from "./useUnitsViewModel";
import { UnitsView } from "./UnitsView";

export default function UnitsPage() {
  const vm = useUnitsViewModel();
  return <UnitsView {...vm} />;
}
