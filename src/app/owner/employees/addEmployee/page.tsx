"use client";
import { useAddEmployeeViewModel } from "./useAddEmployeeViewModel";
import { AddEmployeeView } from "./AddEmployeeView";

export default function AddEmployeePage() {
  const vm = useAddEmployeeViewModel();
  return <AddEmployeeView {...vm} />;
}
