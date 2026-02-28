/**
 * Input để tính giá cho 1 sản phẩm của 1 user.
 * Gồm cả dữ liệu tĩnh (từ event snapshot) và dữ liệu realtime
 * (totalGroupQty, currentMemberCount) lấy qua polling React Query.
 */
export interface ProductPriceInput {
  /** Giá mua lẻ gốc (VND) */
  normalPrice: number;
  /** Giá nhóm cố định do host nhập (ưu tiên hơn groupDiscountPercent) */
  groupPrice?: number;
  /** % giảm giá nhóm theo ngưỡng qty */
  groupDiscountPercent?: number;
  /** Ngưỡng tổng qty toàn nhóm để kích hoạt groupDiscountPercent */
  qtyThreshold?: number;
  /** [Realtime] Tổng qty sản phẩm này đã được mua bởi toàn nhóm */
  totalGroupQty?: number;
  /** [Realtime] Số member đã join event */
  currentMemberCount?: number;
  /** Số member tối thiểu để nhận extra group discount */
  minMembers?: number;
  /** % giảm thêm khi đủ minMembers */
  extraDiscountPercent?: number;
  /** Số lượng user dự định mua */
  userQty: number;
  /** True nếu user chọn mua nhóm */
  isGroupBuy: boolean;
}

/**
 * Kết quả tính giá chi tiết cho 1 sản phẩm của 1 user.
 */
export interface ProductPriceInfo {
  /** Giá gốc chưa giảm (normalPrice) */
  originalPrice: number;
  /**
   * Giá base sau khi áp dụng group buy:
   * - Nếu groupPrice cố định → groupPrice
   * - Nếu chỉ có groupDiscountPercent → normalPrice (discount áp qua itemDiscountPercent)
   */
  basePrice: number;
  /** % giảm item-level (từ qtyThreshold) — áp lên normalPrice */
  itemDiscountPercent: number;
  /** Số tiền giảm item-level mỗi đơn vị (VND) */
  itemDiscountAmountPerUnit: number;
  /** % giảm thêm từ minMembers (order-level, phân bổ về từng product) */
  extraDiscountPercent: number;
  /** Số tiền giảm thêm được phân bổ mỗi đơn vị (VND) */
  proratedExtraDiscountPerUnit: number;
  /** Giá người dùng thực trả cho 1 sản phẩm (VND) */
  finalUnitPrice: number;
  /** Tổng tiền cho cả dòng hàng: finalUnitPrice × userQty */
  finalLineTotal: number;
  /** Tổng % giảm = itemDiscountPercent + extraDiscountPercent */
  totalDiscountPercent: number;
  /** Số tiền tiết kiệm mỗi đơn vị so với mua lẻ (normalPrice − finalUnitPrice) */
  savedAmountPerUnit: number;
  /** True nếu người dùng đã/sẽ đủ điều kiện nhận extra group discount */
  willGetExtraDiscount: boolean;
  /** True nếu đã đủ qtyThreshold (item discount active) */
  itemDiscountActive: boolean;
}
