import { useQuery } from "@tanstack/react-query";
import {
  fetchMyOrders,
  fetchOrderDetail,
} from "../../../shared/services/order-api";
import type { ListOrdersResult, OrderDetail } from "../types/order.types";

export const useMyOrders = (
  page = 1,
  pageSize = 20,
  filters: { eventId?: string; status?: string } = {},
) => {
  return useQuery<ListOrdersResult>({
    queryKey: ["myOrders", page, pageSize, filters],
    queryFn: () => fetchMyOrders(page, pageSize, filters),
  });
};

export const useOrderDetail = (orderId: string) => {
  return useQuery<OrderDetail>({
    queryKey: ["orderDetail", orderId],
    queryFn: () => fetchOrderDetail(orderId),
    enabled: !!orderId,
  });
};
