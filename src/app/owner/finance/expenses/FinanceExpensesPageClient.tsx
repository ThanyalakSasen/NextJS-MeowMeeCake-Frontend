"use client";
import { useFinanceExpensesViewModel } from "./useFinanceExpensesViewModel";
import { FinanceExpensesView } from "./FinanceExpensesView";

export default function FinanceExpensesPage() {
  const vm = useFinanceExpensesViewModel();
  return <FinanceExpensesView {...vm} />;
}
