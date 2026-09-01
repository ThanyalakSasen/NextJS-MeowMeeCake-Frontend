"use client";
import { useManageOrdersViewModel } from "./useManageOrdersViewModel";
import { ManageOrdersView } from "./ManageOrdersView";

export default function ManageOrdersPage() {
  const vm = useManageOrdersViewModel();
  return <ManageOrdersView {...vm} />;
}
