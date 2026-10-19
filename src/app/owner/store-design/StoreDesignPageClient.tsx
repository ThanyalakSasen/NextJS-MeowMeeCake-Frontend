"use client";
import { useStoreDesignViewModel } from "./useStoreDesignViewModel";
import { StoreDesignView } from "./StoreDesignView";

export default function StoreDesignPage() {
  const vm = useStoreDesignViewModel();
  return <StoreDesignView {...vm} />;
}
