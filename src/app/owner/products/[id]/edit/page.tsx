"use client";
import { useEditProductViewModel } from "./useEditProductViewModel";
import { EditProductView } from "./EditProductView";

export default function EditProductPage() {
  const vm = useEditProductViewModel();
  return <EditProductView {...vm} />;
}
