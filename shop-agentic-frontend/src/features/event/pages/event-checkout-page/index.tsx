import { APP_PATHS } from "../../../../app/route-config";
import {
  Alert,
  Button,
  EmptyState,
  SectionCard,
  Switch,
} from "../../../../shared/components/ui";
import AppLayout from "../../../../shared/layouts/app-layout";
import OrderPricingBreakdown from "../../components/order-pricing-breakdown";
import { useEventCheckoutPage } from "../../hooks/use-event-checkout-page";
import { toVND } from "../../utils/price-utils";

export const routePath = APP_PATHS.eventCheckout;

function EventCheckoutPage() {
  const vm = useEventCheckoutPage();

  return (
    <AppLayout>
      <div className="container py-4" style={{ maxWidth: 640 }}>
        {/* ── Header ── */}
        <div className="d-flex align-items-center gap-3 mb-4">
          <button
            type="button"
            className="btn btn-link p-0 text-decoration-none text-body d-flex align-items-center gap-1"
            onClick={vm.onBackToDetail}
          >
            <span aria-hidden="true">←</span> Quay lại
          </button>
          <div className="vr" style={{ height: 24 }} />
          <div>
            <h5 className="mb-0 fw-bold">Xác nhận đơn hàng</h5>
            <p className="text-secondary mb-0" style={{ fontSize: "0.8rem" }}>
              {vm.itemCount} sản phẩm
            </p>
          </div>
        </div>

        {/* ── Success state ── */}
        {vm.orderId ? (
          <div className="text-center py-5">
            <div style={{ fontSize: "3rem" }} className="mb-3">
              🎉
            </div>
            <h4 className="fw-bold text-success mb-1">Đặt hàng thành công!</h4>
            <p className="text-secondary mb-3">
              Mã đơn hàng:{" "}
              <code className="text-dark fw-semibold">{vm.orderId}</code>
            </p>
            {vm.infoMessage && (
              <Alert tone="success" className="mb-3">
                {vm.infoMessage}
              </Alert>
            )}
            <Button variant="outline" onClick={vm.onBackToDetail}>
              Quay lại event
            </Button>
          </div>
        ) : !vm.hasItems ? (
          <EmptyState
            icon={<span>🛒</span>}
            title="Chưa có sản phẩm nào"
            description="Quay lại event để chọn sản phẩm trước khi thanh toán."
            actions={
              <Button
                type="button"
                variant="primary"
                onClick={vm.onBackToDetail}
              >
                Quay lại event
              </Button>
            }
          />
        ) : (
          <div className="d-flex flex-column gap-3">
            {/* ── Items list ── */}
            <SectionCard>
              <p
                className="fw-semibold text-uppercase text-secondary mb-3"
                style={{ fontSize: "0.75rem", letterSpacing: "0.05em" }}
              >
                Sản phẩm đã chọn
              </p>
              <div className="d-flex flex-column gap-2">
                {vm.items.map((item, index) => (
                  <div
                    key={`${item.productId}-${index}`}
                    className="d-flex justify-content-between align-items-start pb-2 border-bottom"
                  >
                    <div className="me-3">
                      <p className="mb-0 fw-medium">{item.name}</p>
                      {item.selectedChoices.length > 0 && (
                        <p className="mb-0 text-secondary small">
                          {item.selectedChoices.join(", ")}
                        </p>
                      )}
                      <p className="mb-0 text-secondary small">
                        × {item.quantity}
                      </p>
                    </div>
                    <div className="text-end flex-shrink-0">
                      <p className="mb-0 fw-semibold">
                        {toVND(item.price * item.quantity)}
                      </p>
                      {item.quantity > 1 && (
                        <p className="mb-0 text-muted small">
                          {toVND(item.price)} / cái
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* ── Group buy toggle ── */}
            <SectionCard>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="fw-semibold mb-0">🛍️ Mua nhóm</p>
                  <p className="text-secondary mb-0 small">
                    Bật để nhận giá ưu đãi khi đủ số lượng / thành viên
                  </p>
                </div>
                <Switch
                  checked={vm.isGroupBuy}
                  onChange={vm.onToggleGroupBuy}
                  disabled={vm.isCalculating || vm.isPlacingOrder}
                />
              </div>
            </SectionCard>

            {/* ── Pricing breakdown ── */}
            {vm.isCalculating && !vm.pricingBreakdown ? (
              <div className="border rounded p-3 bg-light text-center">
                <div
                  className="spinner-border spinner-border-sm text-primary me-2"
                  role="status"
                  aria-hidden="true"
                />
                <span className="text-secondary small">
                  Đang tính toán giá...
                </span>
              </div>
            ) : vm.pricingBreakdown ? (
              <OrderPricingBreakdown
                breakdown={vm.pricingBreakdown}
                isGroupBuy={vm.isGroupBuy}
                isLoading={vm.isCalculating}
              />
            ) : null}

            {/* ── Error ── */}
            {vm.errorMessage && <Alert tone="error">{vm.errorMessage}</Alert>}

            {/* ── CTA ── */}
            <Button
              type="button"
              variant="primary"
              fullWidth
              disabled={vm.isPlacingOrder || vm.isCalculating}
              onClick={vm.onPlaceOrder}
            >
              {vm.isPlacingOrder ? "Đang xử lý..." : "Đặt hàng ngay"}
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default EventCheckoutPage;
