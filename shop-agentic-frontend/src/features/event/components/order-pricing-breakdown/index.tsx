import { Skeleton } from "../../../../shared/components/ui";
import { toPercent, toVND } from "../../../../shared/utils/price-utils";
import { OrderPricingBreakdownProps } from "../../types/order-pricing-breakdown-types";
import styles from "./index.module.scss";

function OrderPricingBreakdown({
  breakdown,
  isGroupBuy,
  isLoading = false,
  liveMemberCount,
}: OrderPricingBreakdownProps) {
  const {
    subtotalBeforeDiscount,
    extraGroupDiscountPercent,
    totalDiscount,
    subtotalAfterDiscount,
    vatRate,
    vatAmount,
    grandTotal,
    currentMembers: staticMembers,
    minMembers,
    membersNeededForDiscount: staticMembersNeeded,
    willGetExtraDiscount: staticWillGet,
    potentialExtraDiscountPercent,
  } = breakdown;

  // Use live member count when available and higher than the static API value
  const currentMembers =
    liveMemberCount != null && liveMemberCount > staticMembers
      ? liveMemberCount
      : staticMembers;
  const membersNeededForDiscount = Math.max(0, minMembers - currentMembers);
  const willGetExtraDiscount =
    liveMemberCount != null && liveMemberCount > staticMembers
      ? currentMembers >= minMembers
      : staticWillGet;

  if (isLoading) {
    return (
      <div className={styles.card}>
        <div className={styles.skeletonRows}>
          <Skeleton height={13} width="55%" />
          <Skeleton height={13} width="75%" />
          <Skeleton height={13} width="65%" />
          <Skeleton height={16} width="88%" />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      {/* Group buy banner */}
      {isGroupBuy && minMembers > 0 ? (
        willGetExtraDiscount ? (
          <div className={`${styles.groupAlert} ${styles.groupAlertSuccess}`}>
            <span className={styles.groupAlertIcon}>✅</span>
            <span>
              Đã đủ {minMembers} thành viên! Đang được giảm thêm{" "}
              <strong>{toPercent(extraGroupDiscountPercent)}</strong>.
            </span>
          </div>
        ) : (
          <div className={`${styles.groupAlert} ${styles.groupAlertWarning}`}>
            <span className={styles.groupAlertIcon}>👥</span>
            <span>
              Còn thiếu <strong>{membersNeededForDiscount} người nữa</strong> để
              được giảm thêm{" "}
              <strong>
                {toPercent(
                  potentialExtraDiscountPercent ?? extraGroupDiscountPercent,
                )}
              </strong>{" "}
              ({currentMembers}/{minMembers} thành viên hiện tại).
            </span>
          </div>
        )
      ) : null}

      {/* Line rows */}
      <div className={styles.rows}>
        <div className={styles.row}>
          <span className={styles.rowLabel}>Tạm tính</span>
          <span className={styles.rowValue}>
            {toVND(subtotalBeforeDiscount)}
          </span>
        </div>

        {isGroupBuy && totalDiscount > 0 ? (
          <div className={styles.row}>
            <span className={styles.rowLabel}>
              Giảm giá nhóm ({toPercent(extraGroupDiscountPercent)})
            </span>
            <span className={`${styles.rowValue} ${styles.rowDiscount}`}>
              −{toVND(totalDiscount)}
            </span>
          </div>
        ) : null}

        {isGroupBuy && totalDiscount > 0 ? (
          <div className={styles.row}>
            <span className={styles.rowLabel}>Sau giảm giá</span>
            <span className={styles.rowValue}>
              {toVND(subtotalAfterDiscount)}
            </span>
          </div>
        ) : null}

        <div className={styles.row}>
          <span className={styles.rowLabel}>
            VAT ({toPercent(vatRate * 100)})
          </span>
          <span className={styles.rowValue}>{toVND(vatAmount)}</span>
        </div>

        <div className={styles.rowDivider} />
      </div>

      {/* Grand total */}
      <div className={styles.totalRow}>
        <span className={styles.totalLabel}>Tổng cộng</span>
        <span className={styles.totalValue}>{toVND(grandTotal)}</span>
      </div>

      {/* Savings callout */}
      {isGroupBuy && totalDiscount > 0 ? (
        <div className={styles.savingsRow}>
          🎉 Tiết kiệm{" "}
          <strong>
            {toVND(subtotalBeforeDiscount - subtotalAfterDiscount)}
          </strong>{" "}
          so với mua lẻ!
        </div>
      ) : null}
    </div>
  );
}

export default OrderPricingBreakdown;
