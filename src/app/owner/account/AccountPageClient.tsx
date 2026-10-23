"use client";
import { useAccountViewModel } from "./useAccountViewModel";
import { AccountView } from "./AccountView";

export default function AccountPage() {
  const vm = useAccountViewModel();
  return <AccountView {...vm} />;
}
