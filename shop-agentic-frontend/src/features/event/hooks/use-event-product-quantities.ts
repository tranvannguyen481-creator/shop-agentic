import { useEffect, useState } from "react";
import { db } from "../../../shared/services/firebase";

/**
 * Shape returned by the hook.
 *
 * - `groupQtyMap`  — `{ [productId]: totalOrderedQty }` — updated in real-time
 *   via `productGroupQty` field on the event document (incremented by backend).
 * - `stockMap`     — `{ [productId]: stockLimit }` — read from the `products`
 *   array inside the event document (0 means unlimited).
 */
export interface EventLiveStockData {
  groupQtyMap: Record<string, number>;
  stockMap: Record<string, number>;
}

const EMPTY: EventLiveStockData = { groupQtyMap: {}, stockMap: {} };

/**
 * Subscribes to real-time Firestore updates on the event document and returns
 * live ordered-quantity and stock-limit data for every product in the event.
 */
export function useEventProductQuantities(eventId: string): EventLiveStockData {
  const [liveData, setLiveData] = useState<EventLiveStockData>(EMPTY);

  useEffect(() => {
    if (!eventId) {
      setLiveData(EMPTY);
      return;
    }

    const unsubscribe = db
      .collection("events")
      .doc(eventId)
      .onSnapshot(
        (snapshot) => {
          if (!snapshot.exists) {
            setLiveData(EMPTY);
            return;
          }

          const data = snapshot.data() ?? {};

          // ── 1. productGroupQty map ────────────────────────────────────────
          const rawGroupQty = data["productGroupQty"];
          const groupQtyMap: Record<string, number> = {};
          if (
            rawGroupQty &&
            typeof rawGroupQty === "object" &&
            !Array.isArray(rawGroupQty)
          ) {
            for (const [key, val] of Object.entries(
              rawGroupQty as Record<string, unknown>,
            )) {
              groupQtyMap[key] =
                typeof val === "number" ? val : Number(val ?? 0);
            }
          }

          // ── 2. stock limits from products array ───────────────────────────
          const stockMap: Record<string, number> = {};
          const rawProducts = data["products"];
          if (Array.isArray(rawProducts)) {
            for (const p of rawProducts as unknown[]) {
              if (!p || typeof p !== "object") continue;
              const prod = p as Record<string, unknown>;
              const id =
                typeof prod["id"] === "string" ? prod["id"].trim() : "";
              if (id) {
                stockMap[id] = Number(prod["stock"] ?? 0) || 0;
              }
            }
          }

          setLiveData({ groupQtyMap, stockMap });
        },
        (err) => {
          console.warn("[useEventProductQuantities] snapshot error:", err);
          setLiveData(EMPTY);
        },
      );

    return () => unsubscribe();
  }, [eventId]);

  return liveData;
}
