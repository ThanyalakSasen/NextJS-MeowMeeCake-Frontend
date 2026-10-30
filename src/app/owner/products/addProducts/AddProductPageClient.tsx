"use client";
import { useAddProductViewModel } from "./useAddProductViewModel";
import { useCustomizationEditor } from "../[id]/edit/useCustomizationEditor";
import { AddProductView } from "./AddProductView";

export default function AddProductPage() {
  const customization = useCustomizationEditor();
  const vm = useAddProductViewModel(customization);
  return <AddProductView {...vm} customization={customization} />;
}
