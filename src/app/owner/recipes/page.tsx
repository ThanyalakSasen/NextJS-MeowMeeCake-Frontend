"use client";
import { useRecipesViewModel } from "./useRecipesViewModel";
import { RecipesView } from "./RecipesView";

export default function RecipesPage() {
  const vm = useRecipesViewModel();
  return <RecipesView {...vm} />;
}
