import { Button, SectionCard } from "../../../../shared/components/ui";
import { EventDetailCartLineItem } from "../../types/event-detail-page-types";
import styles from "./index.module.scss";

interface EventDetailOrderSummaryProps {
  orderLines: EventDetailCartLineItem[];
  orderItemCount: number;
  orderSubtotalText: string;
  orderAdminFeeText: string;
  orderTotalText: string;
  canProceedCheckout: boolean;
  onRemoveOrderLine: (lineId: string) => void;
  onProceedCheckout: () => void;
}

function EventDetailOrderSummary({
  orderLines,
  orderItemCount,
  orderSubtotalText,
  orderAdminFeeText,
  orderTotalText,
  canProceedCheckout,
  onRemoveOrderLine,
  onProceedCheckout,
}: EventDetailOrderSummaryProps) {
  return (
    <SectionCard className={styles.summary}>
      <header className={styles.header}>
        <h3>Order Summary</h3>
        <span>{orderItemCount} items</span>
      </header>

      <div className={styles.lines}>
        {orderLines.length === 0 ? (
          <p className={styles.empty}>No items selected yet.</p>
        ) : (
          orderLines.map((line) => (
            <article key={line.lineId} className={styles.lineItem}>
              <div>
                <p className={styles.productName}>{line.productName}</p>
                <p className={styles.meta}>Qty {line.quantity}</p>
                {line.selectedChoices.length > 0 ? (
                  <p className={styles.meta}>
                    {line.selectedChoices
                      .map((choice) => choice.name)
                      .join(", ")}
                  </p>
                ) : null}
              </div>

              <div className={styles.rightCol}>
                <strong>${line.subtotal.toFixed(2)}</strong>
                <Button
                  type="button"
                  variant="text"
                  className={styles.removeBtn}
                  onClick={() => onRemoveOrderLine(line.lineId)}
                >
                  Remove
                </Button>
              </div>
            </article>
          ))
        )}
      </div>

      <div className={styles.totalRows}>
        <p>
          <span>Subtotal</span>
          <strong>{orderSubtotalText}</strong>
        </p>
        <p>
          <span>Admin fee</span>
          <strong>{orderAdminFeeText}</strong>
        </p>
        <p className={styles.totalRow}>
          <span>Total</span>
          <strong>{orderTotalText}</strong>
        </p>
      </div>

      <Button
        type="button"
        fullWidth
        variant="primary"
        disabled={!canProceedCheckout}
        onClick={onProceedCheckout}
      >
        Proceed to Checkout
      </Button>
    </SectionCard>
  );
}

export default EventDetailOrderSummary;
