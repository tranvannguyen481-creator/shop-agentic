import { OrderPricingBreakdownProps } from "../../types/order-pricing-breakdown-types";
import { toPercent, toVND } from "../../utils/price-utils";

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
      <div className="border rounded p-3 bg-light">
        <p className="text-secondary small text-center mb-0">
          Đang tính toán giá...
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded p-3 bg-light">
      {/* Group buy member progress */}
      {isGroupBuy && minMembers > 0 && (
        <div className="mb-3">
          {willGetExtraDiscount ? (
            <div className="alert alert-success py-2 px-3 mb-0 small">
              ✅ Đã đủ {minMembers} thành viên! Đang được giảm thêm{" "}
              {toPercent(extraGroupDiscountPercent)}.
            </div>
          ) : (
            <div className="alert alert-warning py-2 px-3 mb-0 small">
              👥 Còn thiếu <strong>{membersNeededForDiscount} người nữa</strong>{" "}
              để được giảm thêm {toPercent(extraGroupDiscountPercent)} (
              {currentMembers}/{minMembers} thành viên hiện tại).
            </div>
          )}
        </div>
      )}

      <table className="table table-sm table-borderless mb-0">
        <tbody>
          <tr>
            <td className="text-secondary ps-0">Tạm tính</td>
            <td className="text-end pe-0 font-monospace">
              {toVND(subtotalBeforeDiscount)}
            </td>
          </tr>

          {isGroupBuy && totalDiscount > 0 && (
            <tr className="text-success">
              <td className="ps-0">
                Giảm giá nhóm ({toPercent(extraGroupDiscountPercent)})
              </td>
              <td className="text-end pe-0 font-monospace">
                −{toVND(totalDiscount)}
              </td>
            </tr>
          )}

          {isGroupBuy && totalDiscount > 0 && (
            <tr>
              <td className="text-secondary ps-0">Sau giảm giá</td>
              <td className="text-end pe-0 font-monospace">
                {toVND(subtotalAfterDiscount)}
              </td>
            </tr>
          )}

          <tr>
            <td className="text-secondary ps-0">
              VAT ({toPercent(vatRate * 100)})
            </td>
            <td className="text-end pe-0 font-monospace">{toVND(vatAmount)}</td>
          </tr>

          <tr className="border-top">
            <td className="ps-0 pt-2 fw-semibold">Tổng cộng</td>
            <td className="text-end pe-0 pt-2 fw-semibold font-monospace">
              {toVND(grandTotal)}
            </td>
          </tr>
        </tbody>
      </table>

      {isGroupBuy && totalDiscount > 0 && (
        <div className="alert alert-success py-2 px-3 mt-2 mb-0 small fw-medium">
          🎉 Tiết kiệm {toVND(subtotalBeforeDiscount - subtotalAfterDiscount)}{" "}
          so với mua lẻ!
        </div>
      )}
    </div>
  );
}

export default OrderPricingBreakdown;
 