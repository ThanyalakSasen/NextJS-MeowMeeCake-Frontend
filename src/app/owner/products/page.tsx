"use client";
import { useProductsViewModel } from "./useProductsViewModel";
import { ProductsView } from "./ProductsView";

export default function ProductsPage() {
  const vm = useProductsViewModel();
  return <ProductsView {...vm} />;
}
