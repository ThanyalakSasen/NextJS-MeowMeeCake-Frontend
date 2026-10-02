"use client";
import { Suspense } from "react";
import { useManageOrdersViewModel } from "./useManageOrdersViewModel";
import { ManageOrdersView } from "./ManageOrdersView";

function ManageOrders() {
  const vm = useManageOrdersViewModel();
  return <ManageOrdersView {...vm} />;
}

// useSearchParams (ใน ViewModel — อ่าน ?id= เปิด drawer) ต้องอยู่ใต้ Suspense boundary
export default function ManageOrdersPage() {
  return (
    <Suspense>
      <ManageOrders />
    </Suspense>
  );
}
