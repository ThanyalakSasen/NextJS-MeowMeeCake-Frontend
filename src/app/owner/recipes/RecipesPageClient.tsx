"use client";
import { useRecipesViewModel } from "./useRecipesViewModel";
import { RecipesView } from "./RecipesView";
import { DeleteBlockersModal } from "@/components/shared/feedback";

export default function RecipesPage() {
  const vm = useRecipesViewModel();
  return (
    <>
      <RecipesView {...vm} />
      {vm.deleteBlockedId && <DeleteBlockersModal entity="recipe" id={vm.deleteBlockedId} onClose={vm.closeDeleteBlocked} />}
      {vm.deleteBlockedComponentId && (
        <DeleteBlockersModal entity="component" id={vm.deleteBlockedComponentId} onClose={vm.closeDeleteBlockedComponent} />
      )}
    </>
  );
}
