"use client";
import { useUserLogViewModel } from "./useUserLogViewModel";
import { UserLogView } from "./UserLogView";

export default function UserLogPage() {
  const vm = useUserLogViewModel();
  return <UserLogView {...vm} />;
}
