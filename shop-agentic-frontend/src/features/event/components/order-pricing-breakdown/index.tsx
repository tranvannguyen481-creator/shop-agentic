import {
  Alert,
  Divider,
  SectionCard,
  Skeleton,
} from "../../../../shared/components/ui";
import { toPercent, toVND } from "../../../../shared/utils/price-utils";
import { OrderPricingBreakdownProps } from "../../types/order-pricing-breakdown-types";

function OrderPricingBreakdown({
  breakdown,
  isGroupBuy,
  isLoading = false,
}: OrderPricingBreakdownProps) {
  const {
    subtotalBeforeDiscount,
    extraGroupDiscountPercent,
    totalDiscount,
    subtotalAfterDiscount,
    vatRate,
    vatAmount,
    grandTotal,
    currentMembers,
    minMembers,
    membersNeededForDiscount,
    willGetExtraDiscount,
  } = breakdown;

  if (isLoading) {
    return (
      <SectionCard>
        <div className="d-flex flex-column gap-2">
          <Skeleton height={14} width="60%" />
          <Skeleton height={14} width="80%" />
          <Skeleton height={14} width="70%" />
          <Skeleton height={18} width="90%" />
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard>
      {/* Group buy member progress */}
      {isGroupBuy && minMembers > 0 && (
        <>
          {willGetExtraDiscount ? (
            <Alert tone="success" className="mb-3">
              ✅ Đã đủ {minMembers} thành viên! Đang được giảm thêm{" "}
              {toPercent(extraGroupDiscountPercent)}.
            </Alert>
          ) : (
            <Alert tone="warning" className="mb-3">
              👥 Còn thiếu <strong>{membersNeededForDiscount} người nữa</strong>{" "}
              để được giảm thêm {toPercent(extraGroupDiscountPercent)} (
              {currentMembers}/{minMembers} thành viên hiện tại).
            </Alert>
          )}
        </>
      )}

      <div className="d-flex flex-column gap-2">
        <div className="d-flex justify-content-between align-items-center">
          <span className="text-secondary small">Tạm tính</span>
          <span className="font-monospace small">
            {toVND(subtotalBeforeDiscount)}
          </span>
        </div>

        {isGroupBuy && totalDiscount > 0 && (
          <div className="d-flex justify-content-between align-items-center">
            <span className="text-success small">
              Giảm giá nhóm ({toPercent(extraGroupDiscountPercent)})
            </span>
            <span className="text-success font-monospace small">
              −{toVND(totalDiscount)}
            </span>
          </div>
        )}

        {isGroupBuy && totalDiscount > 0 && (
          <div className="d-flex justify-content-between align-items-center">
            <span className="text-secondary small">Sau giảm giá</span>
            <span className="font-monospace small">
              {toVND(subtotalAfterDiscount)}
            </span>
          </div>
        )}

        <div className="d-flex justify-content-between align-items-center">
          <span className="text-secondary small">
            VAT ({toPercent(vatRate * 100)})
          </span>
          <span className="font-monospace small">{toVND(vatAmount)}</span>
        </div>

        <Divider />

        <div className="d-flex justify-content-between align-items-center">
          <span className="fw-semibold">Tổng cộng</span>
          <span className="fw-semibold font-monospace">
            {toVND(grandTotal)}
          </span>
        </div>
      </div>

      {isGroupBuy && totalDiscount > 0 && (
        <Alert tone="success" className="mt-2 fw-medium">
          🎉 Tiết kiệm {toVND(subtotalBeforeDiscount - subtotalAfterDiscount)}{" "}
          so với mua lẻ!
        </Alert>
      )}
    </SectionCard>
  );
}

export default OrderPricingBreakdown;
