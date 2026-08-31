"use client";
import { useAddProductViewModel } from "./useAddProductViewModel";
import { AddProductView } from "./AddProductView";

export default function AddProductPage() {
  const vm = useAddProductViewModel();
  return <AddProductView {...vm} />;
}
