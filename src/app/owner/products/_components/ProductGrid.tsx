"use client";
import type { Product } from "@/types/product";
import { ProductCard } from "./ProductCard";

export function ProductGrid({
  products,
  canUpdate,
  canDelete,
  onToggleVisible,
  onDelete,
}: {
  products: Product[];
  canUpdate: boolean;
  canDelete: boolean;
  onToggleVisible: (p: Product) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
      {products.map((p) => (
        <ProductCard
          key={p._id}
          product={p}
          canUpdate={canUpdate}
          canDelete={canDelete}
          onToggleVisible={() => onToggleVisible(p)}
          onDelete={() => onDelete(p._id)}
        />
      ))}
    </div>
  );
}
