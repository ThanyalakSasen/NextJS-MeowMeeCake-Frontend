"use client";
import { useStoreInfoViewModel } from "./useStoreInfoViewModel";
import { StoreInfoView } from "./StoreInfoView";

export default function StoreInfoPage() {
  const vm = useStoreInfoViewModel();
  return <StoreInfoView {...vm} />;
}
