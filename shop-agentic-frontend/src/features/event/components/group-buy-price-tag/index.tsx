import { toVND } from "../../../../shared/utils/price-utils";
import { GroupBuyPriceTagProps } from "../../types/group-buy-price-tag-types";
import {
  calcEffectiveGroupPrice,
  calcProgressPercent,
} from "../../utils/price-utils";

function GroupBuyPriceTag({
  normalPrice,
  groupPrice,
  groupDiscountPercent = 0,
  qtyThreshold = 0,
  currentGroupQty = 0,
}: GroupBuyPriceTagProps) {
  const effectiveGroupPrice = calcEffectiveGroupPrice(
    normalPrice,
    groupPrice,
    groupDiscountPercent,
  );
  const hasGroupDiscount =
    effectiveGroupPrice !== null && effectiveGroupPrice < normalPrice;
  const thresholdReached = qtyThreshold > 0 && currentGroupQty >= qtyThreshold;
  const progressPercent = calcProgressPercent(currentGroupQty, qtyThreshold);

  return (
    <div className="d-flex flex-column gap-1">
      {/* Giá mua lẻ */}
      <div className="d-flex align-items-center gap-2">
        <span className="text-secondary small" style={{ minWidth: 64 }}>
          Mua lẻ
        </span>
        <span
          className={`fw-medium${
            hasGroupDiscount ? " text-decoration-line-through text-muted" : ""
          }`}
        >
          {toVND(normalPrice)}
        </span>
      </div>

      {/* Giá mua nhóm */}
      {hasGroupDiscount && effectiveGroupPrice !== null && (
        <div className="d-flex align-items-center gap-2">
          <span
            className="small fw-medium text-success"
            style={{ minWidth: 64 }}
          >
            Mua nhóm
          </span>
          <span className="d-flex align-items-center gap-1 fw-semibold text-success">
            {toVND(effectiveGroupPrice)}
            {groupDiscountPercent > 0 && (
              <span className="badge bg-success-subtle text-success">
                −{groupDiscountPercent}%
              </span>
            )}
          </span>
        </div>
      )}

      {/* Threshold progress */}
      {qtyThreshold > 0 && (
        <div className="mt-1">
          <p className="small text-secondary mb-1">
            {thresholdReached ? (
              <span className="text-success fw-medium">
                ✅ Đã đủ ngưỡng {qtyThreshold} sản phẩm
              </span>
            ) : (
              <span>
                Cần thêm{" "}
                <strong>{qtyThreshold - currentGroupQty} sản phẩm</strong> để mở
                khoá giảm giá nhóm ({currentGroupQty}/{qtyThreshold})
              </span>
            )}
          </p>
          <div
            className="progress"
            style={{ height: 4 }}
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="progress-bar bg-success"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupBuyPriceTag;
