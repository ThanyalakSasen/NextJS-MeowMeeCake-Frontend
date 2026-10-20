"use client";
import { usePermissionsViewModel } from "./usePermissionsViewModel";
import { PermissionsView } from "./PermissionsView";

export default function PermissionsPage() {
  const vm = usePermissionsViewModel();
  return <PermissionsView {...vm} />;
}
