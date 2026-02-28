const ORDER_TYPE = {
  INDIVIDUAL: "individual",
  GROUP: "group",
};

const ORDER_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  SHIPPED: "shipped",
  CANCELLED: "cancelled",
};

const PAYMENT_METHOD = {
  MOMO: "momo",
  VNPAY: "vnpay",
  ZALOPAY: "zalopay",
  COD: "cod",
};

module.exports = {
  ORDER_TYPE,
  ORDER_STATUS,
  PAYMENT_METHOD,
};
