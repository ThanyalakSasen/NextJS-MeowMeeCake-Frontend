"use client";
import { useIngredientStockViewModel } from "./useIngredientStockViewModel";
import { IngredientStockView } from "./IngredientStockView";

export default function IngredientStockPage() {
  const vm = useIngredientStockViewModel();
  return <IngredientStockView {...vm} />;
}
