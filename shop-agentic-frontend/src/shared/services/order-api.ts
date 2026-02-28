import type {
  CalculateOrderRequest,
  CalculateOrderResult,
  ListOrdersResult,
  OrderDetail,
  PlaceOrderRequest,
  PlaceOrderResult,
} from "../../features/event/types/order.types";
import api from "./api";

export const calculateOrder = async (
  payload: CalculateOrderRequest,
): Promise<CalculateOrderResult> => {
  const response = await api.post("/orders/calculate", payload);
  return response.data?.data as CalculateOrderResult;
};

export const placeOrder = async (
  payload: PlaceOrderRequest,
): Promise<PlaceOrderResult> => {
  const response = await api.post("/orders", payload);
  return response.data?.data as PlaceOrderResult;
};

export const fetchOrderDetail = async (
  orderId: string,
): Promise<OrderDetail> => {
  const response = await api.get(`/orders/${encodeURIComponent(orderId)}`);
  const order = response.data?.data as OrderDetail | undefined;
  if (!order?.id) throw new Error("Không tìm thấy đơn hàng");
  return order;
};

export const fetchMyOrders = async (
  page = 1,
  pageSize = 20,
  filters: { eventId?: string; status?: string } = {},
): Promise<ListOrdersResult> => {
  const response = await api.get("/orders", {
    params: { page, pageSize, ...filters },
  });
  const data = response.data?.data;
  return {
    items: data?.items ?? [],
    total: Number(data?.total ?? 0),
    page: Number(data?.page ?? page),
    pageSize: Number(data?.pageSize ?? pageSize),
  };
};

export const fetchEventOrders = async (
  eventId: string,
): Promise<OrderDetail[]> => {
  const response = await api.get(
    `/orders/event/${encodeURIComponent(eventId)}`,
  );
  return (response.data?.data ?? []) as OrderDetail[];
};
