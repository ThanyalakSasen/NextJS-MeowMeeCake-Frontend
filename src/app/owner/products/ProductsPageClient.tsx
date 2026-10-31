"use client";
import { useProductsViewModel } from "./useProductsViewModel";
import { ProductsView } from "./ProductsView";
import { DeleteBlockersModal } from "@/components/shared/feedback";

export default function ProductsPage() {
  const vm = useProductsViewModel();
  return (
    <>
      <ProductsView {...vm} />
      {vm.deleteBlockedId && <DeleteBlockersModal entity="product" id={vm.deleteBlockedId} onClose={vm.closeDeleteBlocked} />}
    </>
  );
}
