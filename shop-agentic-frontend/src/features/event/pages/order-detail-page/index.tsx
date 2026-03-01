import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  MapPin,
  MessageSquare,
  Package,
  ReceiptText,
  ShoppingBag,
} from "lucide-react";
import { APP_PATHS } from "../../../../app/route-config";
import {
  Alert,
  Badge,
  Button,
  SectionCard,
  Skeleton,
} from "../../../../shared/components/ui";
import AppLayout from "../../../../shared/layouts/app-layout";
import { useOrderDetailPage } from "../../hooks/use-order-detail-page";
import type { OrderStatus } from "../../types/order.types";
import styles from "./index.module.scss";

export const routePath = APP_PATHS.orderDetail;

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

function OrderDetailPage() {
  const { order, isLoading, error, goBack } = useOrderDetailPage();

  return (
    <AppLayout>
      {/* Header */}
      <div className={styles.pageHeader}>
        <Button
          type="button"
          variant="text"
          iconOnly
          onClick={goBack}
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </Button>
        <h1 className={styles.pageTitle}>Order Detail</h1>
      </div>

      {isLoading && (
        <div className={styles.loadingWrap}>
          <SectionCard className={styles.skeletonCard}>
            <Skeleton height={20} width="40%" />
            <Skeleton height={14} width="60%" />
            <Skeleton height={14} width="50%" />
          </SectionCard>
          <SectionCard className={styles.skeletonCard}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={48} />
            ))}
          </SectionCard>
        </div>
      )}

      {!isLoading && error && <Alert tone="error">{error}</Alert>}

      {!isLoading && !error && !order && (
        <Alert tone="error">Order not found.</Alert>
      )}

      {!isLoading && order && (
        <div className={styles.content}>
          {/* Summary card */}
          <SectionCard className={styles.summaryCard}>
            <div className={styles.summaryTop}>
              <div>
                <div className={styles.orderId}>
                  #{order.id.slice(-8).toUpperCase()}
                </div>
                <div className={styles.orderFullId}>{order.id}</div>
              </div>
              <Badge tone={STATUS_VARIANT[order.status] ?? "default"}>
                {STATUS_LABEL[order.status] ?? order.status}
              </Badge>
            </div>

            <div className={styles.metaGrid}>
              <div className={styles.metaItem}>
                <CalendarDays size={13} className={styles.metaIcon} />
                <span>{new Date(order.createdAt).toLocaleString("vi-VN")}</span>
              </div>
              <div className={styles.metaItem}>
                <CreditCard size={13} className={styles.metaIcon} />
                <span>{order.paymentMethod.toUpperCase()}</span>
              </div>
              {order.deliveryAddress && (
                <div className={styles.metaItem}>
                  <MapPin size={13} className={styles.metaIcon} />
                  <span>{order.deliveryAddress}</span>
                </div>
              )}
              {order.note && (
                <div className={styles.metaItem}>
                  <MessageSquare size={13} className={styles.metaIcon} />
                  <span>{order.note}</span>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Items */}
          <SectionCard>
            <div className={styles.sectionLabel}>
              <ShoppingBag size={14} />
              Items ({order.items.length})
            </div>
            <div className={styles.itemList}>
              {order.items.map((item) => (
                <div key={item.productId} className={styles.itemRow}>
                  <div className={styles.itemLeft}>
                    <span className={styles.itemDot} />
                    <div>
                      <div className={styles.itemName}>{item.productName}</div>
                      <div className={styles.itemQty}>
                        {item.qty} ×{" "}
                        {item.discountedUnitPrice.toLocaleString("vi-VN")}đ
                      </div>
                    </div>
                  </div>
                  <div className={styles.itemTotal}>
                    {item.lineTotalBeforeVat.toLocaleString("vi-VN")}đ
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Breakdown */}
          <SectionCard>
            <div className={styles.sectionLabel}>
              <ReceiptText size={14} />
              Pricing breakdown
            </div>
            <div className={styles.breakdown}>
              <div className={styles.breakRow}>
                <span>Subtotal</span>
                <span>
                  {order.subtotalBeforeDiscount.toLocaleString("vi-VN")}đ
                </span>
              </div>
              {order.totalDiscount > 0 && (
                <div className={[styles.breakRow, styles.discount].join(" ")}>
                  <span>Discount</span>
                  <span>−{order.totalDiscount.toLocaleString("vi-VN")}đ</span>
                </div>
              )}
              {order.vatAmount > 0 && (
                <div className={styles.breakRow}>
                  <span>VAT ({(order.vatRate * 100).toFixed(0)}%)</span>
                  <span>{order.vatAmount.toLocaleString("vi-VN")}đ</span>
                </div>
              )}
              <div className={[styles.breakRow, styles.grand].join(" ")}>
                <span>Total</span>
                <span>{order.grandTotal.toLocaleString("vi-VN")}đ</span>
              </div>
            </div>
          </SectionCard>

          {/* Summary bottom */}
          <div className={styles.grandCard}>
            <Package size={16} />
            <span className={styles.grandLabel}>Grand total</span>
            <span className={styles.grandAmount}>
              {order.grandTotal.toLocaleString("vi-VN")}đ
            </span>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default OrderDetailPage;
