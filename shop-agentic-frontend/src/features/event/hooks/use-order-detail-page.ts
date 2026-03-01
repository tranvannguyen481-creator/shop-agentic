import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { fetchOrderDetail } from "../../../shared/services/order-api";

export function useOrderDetailPage() {
  const { orderId = "" } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const {
    data: order,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["order-detail", orderId],
    queryFn: () => fetchOrderDetail(orderId),
    enabled: !!orderId,
  });

  const goBack = () => navigate(-1);

  return {
    orderId,
    order,
    isLoading,
    error: error ? String((error as Error).message) : null,
    goBack,
  };
}
