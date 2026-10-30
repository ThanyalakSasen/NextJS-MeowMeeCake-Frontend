"use client";
import { useEditProductViewModel } from "./useEditProductViewModel";
import { EditProductView } from "./EditProductView";
import { useCustomizationEditor } from "./useCustomizationEditor";

export default function EditProductPage() {
  const customization = useCustomizationEditor();
  const vm = useEditProductViewModel(customization);
  return <EditProductView {...vm} customization={customization} />;
}
