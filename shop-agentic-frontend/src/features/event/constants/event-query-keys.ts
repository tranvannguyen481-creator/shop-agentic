
export const EVENT_QUERY_KEYS = {
  all: ["events"] as const,
  detail: (eventId: string) => ["eventDetail", eventId] as const,
  
  calculateOrder: (
    eventId: string,
    isGroupBuy: boolean,
    items: Array<{ productId: string; qty: number }>,
  ) => ["calculateOrder", eventId, isGroupBuy, items] as const,
  myOrders: (params?: { page?: number; pageSize?: number }) =>
    ["orders", "mine", params] as const,
  orderDetail: (orderId: string) => ["orders", orderId] as const,
  eventOrders: (eventId: string) => ["orders", "event", eventId] as const,
};
