"use client";
import { useEditProductViewModel } from "./useEditProductViewModel";
import { EditProductView } from "./EditProductView";
import { useCustomizationEditor } from "./useCustomizationEditor";

export default function EditProductPage() {
  const vm = useEditProductViewModel();
  const customization = useCustomizationEditor();
  return <EditProductView {...vm} customization={customization} />;
}
