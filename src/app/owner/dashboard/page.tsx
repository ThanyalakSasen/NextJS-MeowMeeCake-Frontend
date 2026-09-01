"use client";
import { useDashboardViewModel } from "./useDashboardViewModel";
import { DashboardView } from "./DashboardView";

export default function DashboardPage() {
  const vm = useDashboardViewModel();
  return <DashboardView {...vm} />;
}
