const NOTIFICATION_TYPE = {
  ORDER_NEW: "order_new",
  EVENT_CLOSING_SOON: "event_closing_soon",
  PAYMENT_SUCCESS: "payment_success",
  BROADCAST: "broadcast",
  EVENT_CLOSED: "event_closed",
  GROUP_INVITE: "group_invite",
};

const NOTIFICATION_PRIORITY = {
  HIGH: "high",
  NORMAL: "normal",
};

module.exports = {
  NOTIFICATION_TYPE,
  NOTIFICATION_PRIORITY,
};
