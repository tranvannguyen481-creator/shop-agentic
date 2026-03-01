import { useMemo, useState } from "react";
import type { OrderDetail } from "../types/order.types";
import { useMyOrders } from "./use-my-orders";

export function useListMyPurchasesPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError, refetch } = useMyOrders();

  const orders = useMemo<OrderDetail[]>(() => {
    const items = data?.items ?? [];
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.eventId.toLowerCase().includes(q) ||
        o.status.toLowerCase().includes(q),
    );
  }, [data?.items, search]);

  return {
    search,
    handleSearchChange: (value: string) => setSearch(value),
    orders,
    total: data?.total ?? 0,
    isLoading,
    isError,
    refetch,
  };
}
