import {
  Check,
  ChevronLeft,
  Copy,
  LogOut,
  Share2,
  ShoppingCart,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { APP_PATHS } from "../../../../app/route-config";
import { Alert } from "../../../../shared/components/ui";
import AppLayout from "../../../../shared/layouts/app-layout";
import { toVND } from "../../../../shared/utils/price-utils";
import OrderPricingBreakdown from "../../components/order-pricing-breakdown";
import { useEventGroupBuyPage } from "../../hooks/use-event-group-buy-page";
import styles from "./index.module.scss";

export const routePath = APP_PATHS.eventGroupBuy;

function EventGroupBuyPage() {
  const vm = useEventGroupBuyPage();

  return (
    <AppLayout>
      <div className={styles.page}>
        {/* Sticky header */}
        <div className={styles.header}>
          <button type="button" className={styles.backLink} onClick={vm.onBack}>
            <ChevronLeft size={15} />
            Quay lại
          </button>
          <div className={styles.divider} />
          <div className={styles.headerMeta}>
            <h5 className={styles.headerTitle}>Mua nhóm</h5>
            {vm.hasItems ? (
              <span className={styles.headerSub}>
                {vm.itemCount} sản phẩm &middot; {vm.subtotalText}
              </span>
            ) : null}
          </div>
          <span className={styles.roleBadge}>
            {vm.isHost ? "🏠 Host" : "👤 Thành viên"}
          </span>
        </div>

        {/* Group buy toasts */}
        {vm.groupBuyToasts.length > 0 ? (
          <div className={styles.toastStack}>
            {vm.groupBuyToasts.map((toast) => (
              <div key={toast.id} className={styles.toast}>
                <span className={styles.toastText}>
                  <strong>{toast.displayName}</strong> {toast.message}
                </span>
                <button
                  type="button"
                  className={styles.toastDismiss}
                  onClick={() => vm.onDismissGroupBuyToast(toast.id)}
                  aria-label="Đóng thông báo"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {vm.orderId ? (
          /* Success state */
          <div className={styles.successWrap}>
            <span className={styles.successEmoji}>🎉</span>
            <div className={styles.successCard}>
              <h4 className={styles.successTitle}>Đặt hàng thành công!</h4>
              <p className={styles.successSub}>
                Đơn hàng mua nhóm của bạn đã được ghi nhận.
              </p>
              <code className={styles.orderId}>{vm.orderId}</code>
            </div>
            {vm.infoMessage ? (
              <Alert tone="success">{vm.infoMessage}</Alert>
            ) : null}
          </div>
        ) : !vm.hasItems ? (
          /* Empty state */
          <div className={styles.emptyWrap}>
            <span className={styles.emptyIcon}>🛒</span>
            <h4 className={styles.emptyTitle}>Chưa có sản phẩm nào</h4>
            <p className={styles.emptySub}>
              Quay lại để chọn sản phẩm trước khi mua nhóm.
            </p>
            <button
              type="button"
              className={styles.emptyBackBtn}
              onClick={vm.onBack}
            >
              <ChevronLeft size={15} />
              Quay lại
            </button>
          </div>
        ) : (
          <div className={styles.inner}>
            {/* Error banner */}
            {vm.errorMessage ? (
              <Alert tone="error">{vm.errorMessage}</Alert>
            ) : null}

            {/* Participants */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <Users size={15} className={styles.cardIcon} />
                <h4 className={styles.cardTitle}>Thành viên nhóm</h4>
                <span className={styles.participantCount}>
                  {vm.participantCount}
                </span>
              </div>

              {vm.participants.length > 0 ? (
                <ul className={styles.participantList}>
                  {vm.participants.map((p) => (
                    <li key={p.uid} className={styles.participantItem}>
                      <span className={styles.participantAvatar}>
                        {(p.displayName || p.email).charAt(0).toUpperCase()}
                      </span>
                      <div className={styles.participantMeta}>
                        <span className={styles.participantName}>
                          {p.displayName || p.email}
                        </span>
                        {p.isHost ? (
                          <span className={styles.hostTag}>Host</span>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.participantEmpty}>
                  Đang tải thành viên...
                </p>
              )}
            </div>

            {/* Share link (all members can share) */}
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

            {/* Order lines */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <ShoppingCart size={15} className={styles.cardIcon} />
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
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing breakdown */}
            {vm.pricingBreakdown ? (
              <OrderPricingBreakdown breakdown={vm.pricingBreakdown} />
            ) : vm.isCalculating ? (
              <div className={styles.calcLoader}>Đang tính giá...</div>
            ) : null}

            {/* CTA bar */}
            <div className={styles.ctaBar}>
              <button
                type="button"
                className={styles.placeOrderBtn}
                onClick={vm.onPlaceOrder}
                disabled={vm.isPlacingOrder || vm.isCalculating}
              >
                {vm.isPlacingOrder ? "Đang đặt hàng..." : "Đặt hàng ngay"}
              </button>

              {vm.isHost ? (
                <button
                  type="button"
                  className={styles.dissolveBtn}
                  onClick={vm.onDissolve}
                  disabled={vm.isActioning}
                >
                  <Trash2 size={14} />
                  {vm.isActioning ? "Đang giải tán..." : "Giải tán nhóm"}
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.leaveBtn}
                  onClick={vm.onLeave}
                  disabled={vm.isActioning}
                >
                  <LogOut size={14} />
                  {vm.isActioning ? "Đang rời nhóm..." : "Rời nhóm"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default EventGroupBuyPage;
