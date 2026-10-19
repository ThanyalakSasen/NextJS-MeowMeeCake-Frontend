"use client";
import { useEmployeesViewModel } from "./useEmployeesViewModel";
import { EmployeesView } from "./EmployeesView";

export default function EmployeesPage() {
  const vm = useEmployeesViewModel();
  return <EmployeesView {...vm} />;
}
