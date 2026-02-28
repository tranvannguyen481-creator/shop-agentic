import { useQuery } from "@tanstack/react-query";
import { fetchEventDetail } from "../../../shared/services/event-api";
import { EVENT_QUERY_KEYS } from "../constants/event-query-keys";
import type {
  ProductPriceInfo,
  ProductPriceInput,
} from "../types/product-price-types";
import { calcPerProductPriceInfo } from "../utils/price-utils";

export interface UseProductPriceParams {
  eventId: string;
  productId: string;
  userQty: number;
  isGroupBuy: boolean;
}

export interface UseProductPriceResult {
  
  priceInfo: ProductPriceInfo | null;
  isLoading: boolean;
  isError: boolean;
}

export const useProductPrice = ({
  eventId,
  productId,
  userQty,
  isGroupBuy,
}: UseProductPriceParams): UseProductPriceResult => {
  const {
    data: priceInfo,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [
      ...EVENT_QUERY_KEYS.detail(eventId),
      "price",
      productId,
      userQty,
      isGroupBuy,
    ],
    queryFn: () => fetchEventDetail(eventId),
    enabled: !!eventId && !!productId && userQty > 0,

    refetchInterval: 10_000,

    placeholderData: (previousData) => previousData,
    select: (event): ProductPriceInfo | null => {
      const rawProducts = Array.isArray(event.products) ? event.products : [];
      const product = rawProducts.find(
        (p): p is Record<string, unknown> =>
          typeof p === "object" &&
          p !== null &&
          (p as Record<string, unknown>).id === productId,
      );

      if (!product) return null;

      const discountRules = (
        event.discountRules as Record<string, unknown> | undefined
      )?.groupBuy as Record<string, unknown> | undefined;

      const input: ProductPriceInput = {
        normalPrice: Number(product.normalPrice ?? product.basePrice ?? 0),
        groupPrice: Number(product.groupPrice ?? 0) || undefined,
        groupDiscountPercent:
          Number(product.groupDiscountPercent ?? 0) || undefined,
        qtyThreshold: Number(product.qtyThreshold ?? 0) || undefined,
        totalGroupQty: Number(product.totalGroupQty ?? 0),
        currentMemberCount: Number(event.currentCount ?? 0),
        minMembers: Number(discountRules?.minMembers ?? 0) || undefined,
        extraDiscountPercent:
          Number(discountRules?.extraDiscountPercent ?? 0) || undefined,
        userQty,
        isGroupBuy,
      };

      return calcPerProductPriceInfo(input);
    },
  });

  return {
    priceInfo: priceInfo ?? null,
    isLoading,
    isError,
  };
};
