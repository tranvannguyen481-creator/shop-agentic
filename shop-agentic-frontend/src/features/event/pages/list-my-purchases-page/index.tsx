import {
  ChevronRight,
  CreditCard,
  Package,
  Search,
  ShoppingCart,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { APP_PATHS } from "../../../../app/route-config";
import SearchBar from "../../../../shared/components/search-bar";
import {
  Badge,
  Button,
  EmptyState,
  SectionCard,
  Spinner,
} from "../../../../shared/components/ui";
import AppLayout from "../../../../shared/layouts/app-layout";
import { useListMyPurchasesPage } from "../../hooks/use-list-my-purchases-page";
import type { OrderStatus } from "../../types/order.types";
import styles from "./index.module.scss";

export const routePath = APP_PATHS.listMyPurchases;

const STATUS_VARIANT: Record<
  OrderStatus,
  "default" | "success" | "warning" | "danger"
> = {
  pending: "warning",
  paid: "success",
  shipped: "default",
  cancelled: "danger",
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  shipped: "Shipped",
  cancelled: "Cancelled",
};

function ListMyPurchasesPage() {
  const navigate = useNavigate();
  const { search, handleSearchChange, orders, isLoading } =
    useListMyPurchasesPage();

  const goToDetail = (orderId: string) => {
    navigate(APP_PATHS.orderDetail.replace(":orderId", orderId));
  };

  return (
    <AppLayout>
      <SearchBar value={search} onValueChange={handleSearchChange} />

      {isLoading ? (
        <div className="d-flex justify-content-center mt-5">
          <Spinner />
        </div>
      ) : orders.length === 0 ? (
        <SectionCard className={styles.emptyCard}>
          <EmptyState
            icon={<ShoppingCart />}
            title="No purchases yet"
            description="You haven't placed any orders yet. Explore events and start your first purchase."
            actions={
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={() => navigate(APP_PATHS.home)}
              >
                <Search size={16} />
                EXPLORE EVENTS
              </Button>
            }
          />
        </SectionCard>
      ) : (
        <div className={styles.list}>
          {orders.map((order) => (
            <div
              key={order.id}
              className={styles.orderCard}
              data-status={order.status}
              onClick={() => goToDetail(order.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && goToDetail(order.id)}
            >
              <div className={styles.accent} />
              <div className={styles.cardBody}>
                <div className={styles.cardTop}>
                  <span className={styles.orderId}>
                    #{order.id.slice(-8).toUpperCase()}
                  </span>
                  <Badge tone={STATUS_VARIANT[order.status] ?? "default"}>
                    {STATUS_LABEL[order.status] ?? order.status}
                  </Badge>
                </div>

                <div className={styles.cardMid}>
                  <span className={styles.amount}>
                    {order.grandTotal.toLocaleString("vi-VN")}đ
                  </span>
                  <ChevronRight size={16} className={styles.chevron} />
                </div>

                <div className={styles.cardBottom}>
                  <span className={styles.chip}>
                    <Package size={11} />
                    {order.items.length} item
                    {order.items.length !== 1 ? "s" : ""}
                  </span>
                  <span className={styles.chip}>
                    <CreditCard size={11} />
                    {order.paymentMethod.toUpperCase()}
                  </span>
                  <span className={styles.chipDot} />
                  <span className={styles.date}>
                    {new Date(order.createdAt).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}

export default ListMyPurchasesPage;
