"use client";
import { useIngredientsViewModel } from "./useIngredientsViewModel";
import { IngredientsView } from "./IngredientsView";
import { DeleteBlockersModal } from "@/components/shared/feedback";

export default function IngredientsPage() {
  const vm = useIngredientsViewModel();
  return (
    <>
      <IngredientsView {...vm} />
      {vm.deleteBlockedId && <DeleteBlockersModal entity="ingredient" id={vm.deleteBlockedId} onClose={vm.closeDeleteBlocked} />}
    </>
  );
}
