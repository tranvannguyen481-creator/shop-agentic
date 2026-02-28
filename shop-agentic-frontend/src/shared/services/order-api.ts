import type {
  CalculateOrderRequest,
  CalculateOrderResult,
  ListOrdersResult,
  OrderDetail,
  PlaceOrderRequest,
  PlaceOrderResult,
} from "../../features/event/types/order.types";
import api from "./api";

/**
 * Tính tiền đơn hàng (preview, không lưu DB).
 * Gọi API này để hiển thị breakdown trước khi user xác nhận.
 */
export const calculateOrder = async (
  payload: CalculateOrderRequest,
): Promise<CalculateOrderResult> => {
  const response = await api.post("/orders/calculate", payload);
  return response.data?.data as CalculateOrderResult;
};

/**
 * Đặt đơn hàng thực sự — lưu vào Firestore.
 */
export const placeOrder = async (
  payload: PlaceOrderRequest,
): Promise<PlaceOrderResult> => {
  const response = await api.post("/orders", payload);
  return response.data?.data as PlaceOrderResult;
};

/**
 * Lấy chi tiết 1 đơn hàng theo orderId.
 */
export const fetchOrderDetail = async (
  orderId: string,
): Promise<OrderDetail> => {
  const response = await api.get(`/orders/${encodeURIComponent(orderId)}`);
  const order = response.data?.data as OrderDetail | undefined;
  if (!order?.id) throw new Error("Không tìm thấy đơn hàng");
  return order;
};

/**
 * Lấy danh sách đơn hàng của user hiện tại (phân trang, có thể lọc theo event/status).
 */
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

/**
 * Host xem tất cả đơn hàng của 1 event.
 */
export const fetchEventOrders = async (
  eventId: string,
): Promise<OrderDetail[]> => {
  const response = await api.get(
    `/orders/event/${encodeURIComponent(eventId)}`,
  );
  return (response.data?.data ?? []) as OrderDetail[];
};
