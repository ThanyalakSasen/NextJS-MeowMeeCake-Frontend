"use client";
import { usePOSViewModel } from "./usePOSViewModel";
import { POSView } from "./POSView";

export default function OrderInStorePage() {
  const vm = usePOSViewModel();
  return <POSView {...vm} />;
}
