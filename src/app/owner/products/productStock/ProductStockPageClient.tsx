"use client";
import { useProductStockViewModel } from "./useProductStockViewModel";
import { ProductStockView } from "./ProductStockView";

export default function ProductStockPage() {
  const vm = useProductStockViewModel();
  return <ProductStockView {...vm} />;
}
