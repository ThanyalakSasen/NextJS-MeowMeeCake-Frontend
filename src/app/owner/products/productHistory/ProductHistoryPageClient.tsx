"use client";
import { useProductHistoryViewModel } from "./useProductHistoryViewModel";
import { ProductHistoryView } from "./ProductHistoryView";

export default function ProductHistoryPage({ productId }: { productId: string }) {
  const vm = useProductHistoryViewModel(productId);
  return <ProductHistoryView {...vm} />;
}
