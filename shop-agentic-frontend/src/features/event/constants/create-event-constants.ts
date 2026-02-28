import { CreateEventFormValues } from "../types/create-event-types";

export const IMPORTANT_NOTES_MODAL_KEY = "create-event:important-notes";
export const EXTERNAL_URL_MODAL_KEY = "create-event:external-url";
export const DELIVERY_OPTIONS_MODAL_KEY = "create-event:delivery-options";
export const CREATE_EVENT_DRAFT_STORAGE_KEY = "shop-agentic:event:create:draft";

export const EVENT_MODE_OPTIONS = [
  { label: "Shop Agentic GroupBuy", value: "group-buy" },
] as const;

export const CREATE_EVENT_DEFAULT_VALUES: CreateEventFormValues = {
  mode: "group-buy",
  groupId: "",
  uploadExcel: null,
  title: "",
  description: "",
  pickupLocation: "",
  closingDate: "2026-02-27",
  collectionDate: "2026-03-05",
  collectionTime: "",
  paymentAfterClosing: false,
  payTogether: true,
  adminFee: "0.0",
  addImportantNotes: false,
  importantNotes: [],
  addExternalUrl: false,
  externalUrlFieldName: "",
  externalUrl: "",
  addDeliveryOptions: false,
  deliveryScheduleDate: "",
  deliveryTimeFrom: "",
  deliveryTimeTo: "",
  deliveryFees: [],
  requestDeliveryDetails: false,
};
