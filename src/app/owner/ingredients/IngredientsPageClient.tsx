"use client";
import { useIngredientsViewModel } from "./useIngredientsViewModel";
import { IngredientsView } from "./IngredientsView";

export default function IngredientsPage() {
  const vm = useIngredientsViewModel();
  return <IngredientsView {...vm} />;
}
