import { useState } from "react";

export function useListMyPurchasesPage() {
  const [search, setSearch] = useState("");

  return {
    search,
    handleSearchChange: (value: string) => setSearch(value),
  };
}
