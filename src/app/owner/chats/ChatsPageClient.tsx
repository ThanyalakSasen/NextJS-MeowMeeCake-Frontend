"use client";
import { useChatsViewModel } from "./useChatsViewModel";
import { ChatsView } from "./ChatsView";

export default function ChatsPageClient() {
  const vm = useChatsViewModel();
  return <ChatsView {...vm} />;
}
