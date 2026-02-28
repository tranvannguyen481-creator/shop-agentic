export const toVND = (value: number): string =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(Math.round(value));

export const toPercent = (value: number): string =>
  `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
