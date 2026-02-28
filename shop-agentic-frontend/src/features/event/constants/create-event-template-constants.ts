export const CREATE_EVENT_TEMPLATE_FIELDS = [
  "mode",
  "title",
  "closingDate",
  "collectionDate",
  "collectionTime",
  "description",
  "pickupLocation",
  "adminFee",
] as const;

export const CREATE_EVENT_TEMPLATE_REQUIRED_FIELDS = [
  "mode",
  "title",
  "closingDate",
  "collectionDate",
  "collectionTime",
] as const;

export type CreateEventTemplateField =
  (typeof CREATE_EVENT_TEMPLATE_FIELDS)[number];

export const CREATE_EVENT_TEMPLATE_SAMPLE_VALUES: Record<
  CreateEventTemplateField,
  string
> = {
  mode: "group-buy",
  title: "Weekend Fresh Produce",
  closingDate: "2026-03-10",
  collectionDate: "2026-03-12",
  collectionTime: "18:30",
  description: "Seasonal fruits and vegetables from local farms",
  pickupLocation: "Blk 123 Community Center",
  adminFee: "0.0",
};
