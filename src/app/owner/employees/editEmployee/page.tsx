"use client";
import { Suspense } from "react";
import { useEditEmployeeViewModel } from "./useEditEmployeeViewModel";
import { EditEmployeeView } from "./EditEmployeeView";

// useSearchParams (ใน ViewModel) ต้องอยู่ใต้ Suspense boundary
function EditEmployeeInner() {
  const vm = useEditEmployeeViewModel();
  return <EditEmployeeView {...vm} />;
}

export default function EditEmployeePage() {
  return (
    <Suspense>
      <EditEmployeeInner />
    </Suspense>
  );
}
