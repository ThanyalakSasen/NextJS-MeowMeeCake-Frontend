"use client";
import { useNotificationHistoryViewModel } from "./useNotificationHistoryViewModel";
import { NotificationHistoryView } from "./NotificationHistoryView";

export default function NotificationHistoryPage() {
  const vm = useNotificationHistoryViewModel();
  return <NotificationHistoryView {...vm} />;
}
