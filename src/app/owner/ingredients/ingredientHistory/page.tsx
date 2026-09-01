"use client";
import { useIngredientHistoryViewModel } from "./useIngredientHistoryViewModel";
import { IngredientHistoryView } from "./IngredientHistoryView";

export default function IngredientHistoryPage() {
  const vm = useIngredientHistoryViewModel();
  return <IngredientHistoryView {...vm} />;
}
