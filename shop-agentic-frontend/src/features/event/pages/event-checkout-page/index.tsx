import {
  Check,
  ChevronLeft,
  Copy,
  CreditCard,
  Share2,
  Users,
  X,
} from "lucide-react";
import { APP_PATHS } from "../../../../app/route-config";
import { Alert, Switch } from "../../../../shared/components/ui";
import AppLayout from "../../../../shared/layouts/app-layout";
import { toVND } from "../../../../shared/utils/price-utils";
import OrderPricingBreakdown from "../../components/order-pricing-breakdown";
import { useEventCheckoutPage } from "../../hooks/use-event-checkout-page";
import styles from "./index.module.scss";

export const routePath = APP_PATHS.eventCheckout;

function EventCheckoutPage() {
  const vm = useEventCheckoutPage();

  return (
    <AppLayout>
      <div className={styles.page}>
        {/* Sticky header */}
        <div className={styles.header}>
          <button
            type="button"
            className={styles.backLink}
            onClick={vm.onBackToDetail}
          >
            <ChevronLeft size={15} />
            Quay lại
          </button>
          <div className={styles.divider} />
          <div className={styles.headerMeta}>
            <h5 className={styles.headerTitle}>Xác nhận đơn hàng</h5>
            {vm.hasItems ? (
              <span className={styles.headerSub}>
                {vm.itemCount} sản phẩm &middot; {vm.subtotalText}
              </span>
            ) : null}
          </div>
        </div>

        {vm.orderId ? (
          /* Success state */
          <div className={styles.successWrap}>
            <span className={styles.successEmoji}>🎉</span>
            <div className={styles.successCard}>
              <h4 className={styles.successTitle}>Đặt hàng thành công!</h4>
              <p className={styles.successSub}>
                Đơn hàng của bạn đã được ghi nhận.
              </p>
              <code className={styles.orderId}>{vm.orderId}</code>
            </div>
            {vm.infoMessage ? (
              <Alert tone="success">{vm.infoMessage}</Alert>
            ) : null}
            <button
              type="button"
              className={styles.successBackBtn}
              onClick={vm.onBackToDetail}
            >
              <ChevronLeft size={14} />
              Quay lại event
            </button>
          </div>
        ) : !vm.hasItems ? (
          /* Empty state */
          <div className={styles.emptyWrap}>
            <span className={styles.emptyIcon}>🛒</span>
            <h4 className={styles.emptyTitle}>Chưa có sản phẩm nào</h4>
            <p className={styles.emptySub}>
              Quay lại event để chọn sản phẩm trước khi thanh toán.
            </p>
            <button
              type="button"
              className={styles.emptyBackBtn}
              onClick={vm.onBackToDetail}
            >
              <ChevronLeft size={15} />
              Quay lại event
            </button>
          </div>
        ) : (
          /* Main checkout */
          <div className={styles.inner}>
            {/* Order lines */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h4 className={styles.cardTitle}>Sản phẩm đã chọn</h4>
                <span className={styles.itemCount}>{vm.itemCount}</span>
              </div>
              <div className={styles.lineList}>
                {vm.items.map((item, index) => (
                  <div
                    key={`${item.productId}-${index}`}
                    className={styles.lineItem}
                  >
                    <div className={styles.lineLeft}>
                      <span className={styles.qtyBadge}>×{item.quantity}</span>
                      <div>
                        <p className={styles.lineName}>{item.name}</p>
                        {item.selectedChoices.length > 0 ? (
                          <p className={styles.lineOptions}>
                            {item.selectedChoices.join(" · ")}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className={styles.lineRight}>
                      <span className={styles.lineTotal}>
                        {toVND(item.price * item.quantity)}
                      </span>
                      {item.quantity > 1 ? (
                        <span className={styles.lineUnit}>
                          {toVND(item.price)} / cái
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Group buy toggle */}
            <div className={styles.groupBuyCard}>
              <span className={styles.groupBuyIcon}>🛍️</span>
              <div className={styles.groupBuyMeta}>
                <p className={styles.groupBuyLabel}>Mua nhóm</p>
                <p className={styles.groupBuySub}>
                  {vm.isJoiningGroupBuy
                    ? "Đang tham gia phiên mua nhóm..."
                    : "Bật để nhận giá ưu đãi khi đủ số lượng / thành viên"}
                </p>
              </div>
              <Switch
                checked={vm.isGroupBuy}
                onChange={vm.onToggleGroupBuy}
                disabled={
                  vm.isCalculating || vm.isPlacingOrder || vm.isJoiningGroupBuy
                }
              />
            </div>

            {/* Live member count — visible when group buy is on */}
            {vm.isGroupBuy && vm.liveMemberCount > 0 ? (
              <div className={styles.liveMemberCard}>
                <Users size={16} className={styles.liveMemberIcon} />
                <span className={styles.liveMemberCount}>
                  {vm.liveMemberCount}
                </span>
                <span className={styles.liveMemberLabel}>
                  người đã tham gia mua nhóm
                </span>
              </div>
            ) : null}

            {/* Share link — visible only when group buy is on */}
            {vm.isGroupBuy ? (
              <div className={styles.shareCard}>
                <div className={styles.shareCardHeader}>
                  <Share2 size={14} className={styles.shareCardIcon} />
                  <span className={styles.shareCardTitle}>
                    Mời bạn bè mua nhóm
                  </span>
                </div>
                <p className={styles.shareCardSub}>
                  Chia sẻ link để mọi người cùng tham gia &amp; nhận giá ưu đãi
                </p>
                <div className={styles.shareUrlRow}>
                  <span className={styles.shareUrlText}>{vm.shareUrl}</span>
                  <button
                    type="button"
                    className={`${styles.shareActionBtn} ${vm.shareCopied ? styles.shareActionBtnCopied : ""}`}
                    onClick={vm.onCopyShareLink}
                    aria-label="Sao chép link"
                  >
                    {vm.shareCopied ? (
                      <>
                        <Check size={13} /> Đã sao chép
                      </>
                    ) : (
                      <>
                        <Copy size={13} /> Sao chép
                      </>
                    )}
                  </button>
                </div>
                {vm.hasNativeShare ? (
                  <button
                    type="button"
                    className={styles.nativeShareBtn}
                    onClick={vm.onNativeShare}
                  >
                    <Share2 size={14} />
                    Chia sẻ ngay
                  </button>
                ) : null}
              </div>
            ) : null}

            {/* Pricing breakdown */}
            {vm.isCalculating && !vm.pricingBreakdown ? (
              <div className={styles.card}>
                <div className={styles.pricingSpinner}>
                  <span className={styles.spinner} />
                  <span>Đang tính toán giá...</span>
                </div>
              </div>
            ) : vm.pricingBreakdown ? (
              <OrderPricingBreakdown
                breakdown={vm.pricingBreakdown}
                isGroupBuy={vm.isGroupBuy}
                isLoading={vm.isCalculating}
                liveMemberCount={vm.liveMemberCount}
              />
            ) : null}

            {/* Error */}
            {vm.errorMessage ? (
              <Alert tone="error">{vm.errorMessage}</Alert>
            ) : null}
          </div>
        )}

        {/* Action bar */}
        {vm.hasItems && !vm.orderId ? (
          <div className={styles.actionBar}>
            <button
              type="button"
              className={styles.placeOrderBtn}
              disabled={vm.isPlacingOrder || vm.isCalculating}
              onClick={vm.onPlaceOrder}
            >
              {vm.isPlacingOrder ? (
                <>
                  <span className={styles.spinner} />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <CreditCard size={17} />
                  Đặt hàng ngay
                </>
              )}
            </button>
          </div>
        ) : null}

        {/* Group buy real-time toasts */}
        {vm.groupBuyToasts.length > 0 ? (
          <div className={styles.toastContainer}>
            {vm.groupBuyToasts.map((toast) => (
              <div key={toast.id} className={styles.groupToast}>
                <span className={styles.groupToastEmoji}>👋</span>
                <span className={styles.groupToastMessage}>
                  {toast.message}
                </span>
                <button
                  type="button"
                  className={styles.groupToastDismiss}
                  onClick={() => vm.onDismissGroupBuyToast(toast.id)}
                  aria-label="Đóng"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}

export default EventCheckoutPage;
