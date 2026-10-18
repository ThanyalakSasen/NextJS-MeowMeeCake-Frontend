"use client";
import { useSearchSynonymsViewModel } from "./useSearchSynonymsViewModel";
import { SearchSynonymsView } from "./SearchSynonymsView";

export default function SearchSynonymsPage() {
  const vm = useSearchSynonymsViewModel();
  return <SearchSynonymsView {...vm} />;
}
